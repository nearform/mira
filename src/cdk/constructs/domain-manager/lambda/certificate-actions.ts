import * as aws from 'aws-sdk'
import * as crypto from 'crypto'
import { DescribeCertificateResponse, RequestCertificateResponse, CertificateSummary } from 'aws-sdk/clients/acm'

/**
 * The maximum number of attempts made in resolving various resources such as
 * DNS records or Certificates.
 *
 * @ignore - Excluded from documentation generation.
 */
const maxAttempts = 10

const sleep = function (ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function requestCertificate (requestId: string, domainName: string, subjectAlternativeNames: string[], hostedZoneId: string, region: string, route53Role: string): Promise<string> {
  const acm = new aws.ACM({ region })

  console.log(`Requesting certificate for ${domainName}`)
  console.log('debug message #1')

  const reqCertResponse: RequestCertificateResponse = await acm.requestCertificate({
    DomainName: domainName,
    SubjectAlternativeNames: subjectAlternativeNames,
    IdempotencyToken: crypto.createHash('sha256').update(requestId).digest('hex').substr(0, 32),
    ValidationMethod: 'DNS'
  }).promise()
  console.log('debug message #2')
  console.log(`Certificate ARN: ${reqCertResponse.CertificateArn}`)
  if (!reqCertResponse.CertificateArn) throw new Error('Certificate couldn\'t be created, no CertificateArn available in RequestCertificateResponse.')

  console.log('Waiting for ACM to provide DNS records for validation...')

  let record
  for (let attempt = 0; attempt < maxAttempts && !record; attempt++) {
    const reqCertDescribeResponse: DescribeCertificateResponse = await acm.describeCertificate({ CertificateArn: reqCertResponse.CertificateArn }).promise()
    const options = (reqCertDescribeResponse && reqCertDescribeResponse.Certificate && reqCertDescribeResponse.Certificate.DomainValidationOptions) || []

    if (options.length > 0 && options[0].ResourceRecord) {
      record = options[0].ResourceRecord
    } else {
      // Exponential backoff with jitter based on 200ms base
      // component of backoff fixed to ensure minimum total wait time on
      // slow targets.
      const base = Math.pow(2, attempt)
      await sleep(Math.random() * base * 50 + base * 150)
    }
  }
  if (!record) {
    throw new Error(`Response from describeCertificate did not contain DomainValidationOptions after ${maxAttempts} attempts.`)
  }

  console.log(`Assuming role with Route53 permissions: ${route53Role}`)
  const sts = new aws.STS()
  const sessionCredentials = await sts.assumeRole({ RoleArn: route53Role, RoleSessionName: 'CrossAccountRoute53LambdaSession' }).promise()
  aws.config.update({
    accessKeyId: sessionCredentials?.Credentials?.AccessKeyId,
    secretAccessKey: sessionCredentials?.Credentials?.SecretAccessKey,
    sessionToken: sessionCredentials?.Credentials?.SessionToken
  })
  console.log(`Upserting DNS record into zone ${hostedZoneId}: ${record.Name} ${record.Type} ${record.Value}`)
  const route53 = new aws.Route53()

  const changeBatch = await route53.changeResourceRecordSets({
    ChangeBatch: {
      Changes: [{
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: record.Name,
          Type: record.Type,
          TTL: 60,
          ResourceRecords: [{
            Value: record.Value
          }]
        }
      }]
    },
    HostedZoneId: hostedZoneId
  }).promise()

  console.log('Waiting for DNS records to commit...')
  await route53.waitFor('resourceRecordSetsChanged', {
    // Wait up to 5 minutes
    $waiter: {
      delay: 30,
      maxAttempts: 10
    },
    Id: changeBatch.ChangeInfo.Id
  }).promise()

  console.log('Waiting for validation...')
  await acm.waitFor('certificateValidated', {
    // Wait up to 9 minutes and 30 seconds
    $waiter: {
      delay: 30,
      maxAttempts: 19
    },
    CertificateArn: reqCertResponse.CertificateArn || ''
  }).promise()

  return reqCertResponse.CertificateArn
}

export async function deleteCertificate (identifier: string, region: string, route53Role: string): Promise<void> {
  const acm = new aws.ACM({ region })

  try {
    console.log(`Waiting for certificate ${identifier} to become unused`)
    let arn: string = identifier
    if (identifier.startsWith('arn:')) {
      let inUseByResources = []
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { Certificate } = await acm.describeCertificate({ CertificateArn: identifier }).promise()

        inUseByResources = Certificate?.InUseBy || []

        if (inUseByResources.length) {
        // Exponential backoff with jitter based on 200ms base
        // component of backoff fixed to ensure minimum total wait time on
        // slow targets.
          const base = Math.pow(2, attempt)
          await sleep(Math.random() * base * 50 + base * 150)
        } else {
          break
        }
      }

      if (inUseByResources.length) {
        throw new Error(`Response from describeCertificate did not contain an empty InUseBy list after ${maxAttempts} attempts.`)
      }

      console.log(`Deleting certificate ${identifier}`)
    } else {
      const availableCertificates = await acm.listCertificates().promise()
      const certificateSummary: CertificateSummary | undefined =
        availableCertificates?.CertificateSummaryList?.find((certificateEntry) => {
          return certificateEntry.DomainName === identifier
        })
      arn = certificateSummary?.CertificateArn || ''
    }

    if (!arn) {
      console.warn(`${identifier} not found as a certificate, possible removed manually`)
      return Promise.resolve()
    }
    await acm.deleteCertificate({
      CertificateArn: arn
    }).promise()

    console.log(`TODO In here there should be role assumed: ${route53Role} and confirmation DNS record should be removed`)
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') {
      throw err
    }
  }
}
