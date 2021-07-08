import * as aws from 'aws-sdk'
import { ResourceRecordSets } from 'aws-sdk/clients/route53'

/**
 * An Enum representing Route 53 Actions
 *
 * @ignore - Excluded from documentation generation.
 */
enum Route53Action {
  UPSERT = 'UPSERT',
  CREATE = 'CREATE',
  DELETE = 'DELETE'
}

const domainOnList = (list: ResourceRecordSets, domain: string): boolean => {
  return list.filter((entry) => entry.Name === `${domain}.`).length > 0
}

async function changeRecord (action: Route53Action, hostedZone: string, source: string, target: string): Promise<unknown> {
  const route53 = new aws.Route53()
  return route53.changeResourceRecordSets({
    HostedZoneId: hostedZone,
    ChangeBatch: {
      Comment: `CNAME ${source} -> ${target}`,
      Changes: [
        {
          Action: action,
          ResourceRecordSet: {
            Name: source,
            Type: 'CNAME',
            TTL: 300,
            ResourceRecords: [{ Value: target }]
          }
        }
      ]
    }
  }).promise()
}

export async function createRecord (hostedZoneId: string, source: string, target: string): Promise<unknown> {
  return changeRecord(Route53Action.CREATE, hostedZoneId, source, target)
}

export async function upsertRecord (hostedZoneId: string, source: string, target: string): Promise<unknown> {
  return changeRecord(Route53Action.UPSERT, hostedZoneId, source, target)
}

export async function deleteRecord (hostedZoneId: string, source: string, target: string): Promise<string|unknown> {
  const route53 = new aws.Route53()
  const matchingRecords = await route53.listResourceRecordSets({ HostedZoneId: hostedZoneId }).promise()
  if (!domainOnList(matchingRecords.ResourceRecordSets, source)) return Promise.resolve('No ResourceRecordSets found')
  console.log('found record set, performing action DELETE')
  return changeRecord(Route53Action.DELETE, hostedZoneId, source, target)
}
