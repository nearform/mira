import { Context, SNSEvent } from 'aws-lambda'
import sendCfnResponse from './send-cfn-response'
import { requestCertificate, deleteCertificate } from './certificate-actions'

interface ResponseData {
  Arn?: string
}

export async function handler (event: SNSEvent, context: Context): Promise<string> {
  console.log(`SNS event: ${JSON.stringify(event)}`)
  const lambdaEvent = JSON.parse(event.Records[0].Sns.Message)

  try {
    const hostedZone = process.env.HOSTED_ZONE || ''
    if (!hostedZone) {
      throw new Error('Hosted Zone not set')
    }

    const type = lambdaEvent.RequestType
    const domain = lambdaEvent.ResourceProperties.Domain
    const region = lambdaEvent.ResourceProperties.Region || 'us-east-1' // by default certificates should be located in North Virginia to allow CloudFront usage.
    const route53Role = lambdaEvent.ResourceProperties.Route53Role

    const responseData: ResponseData = {}
    let certificateArn
    let physicalResourceId
    switch (type) {
      case 'Create': {
        console.log(`Requesting Create ACM certificate for ${domain} in region ${region}`)
        certificateArn = await requestCertificate(
          lambdaEvent.RequestId,
          domain,
          lambdaEvent.ResourceProperties.SubjectAlternativeNames,
          hostedZone,
          region,
          route53Role
        )
        responseData.Arn = physicalResourceId = certificateArn
        break
      }
      case 'Update': {
        const olddomain = lambdaEvent.OldResourceProperties.Domain
        console.log(`Requesting Update ACM certificate for ${domain} in region ${region}`)
        await deleteCertificate(olddomain, region, route53Role)
        certificateArn = await requestCertificate(
          lambdaEvent.RequestId,
          domain,
          lambdaEvent.ResourceProperties.SubjectAlternativeNames,
          hostedZone,
          region,
          route53Role
        )
        responseData.Arn = physicalResourceId = certificateArn
        break
      }
      case 'Delete': {
        physicalResourceId = lambdaEvent.PhysicalResourceId
        // If the resource didn't create correctly, the physical resource ID won't be the
        // certificate ARN, so don't try to delete it in that case.
        if (physicalResourceId.startsWith('arn:')) {
          console.log(`Deleting Certificate for ${domain}`)
          await deleteCertificate(physicalResourceId, region, route53Role)
        }
        break
      }
      default:
        console.error(`Unexpected Request Type: ${type}`)
        throw new Error('Unexpected Request Type')
    }
    console.log('Route53 successfully updated')
    const responseStatus = 'SUCCESS'
    return sendCfnResponse(lambdaEvent, context, responseStatus, responseData, physicalResourceId)
  } catch (error) {
    console.error(`Error: ${error}`)
    const responseStatus = 'FAILED'
    const responseData = {}
    return sendCfnResponse(lambdaEvent, context, responseStatus, responseData)
  }
}
