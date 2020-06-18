import { Route53Action, Utils, send } from './utils'

interface ResponseData {
  Arn?: string
}

export const handler = async (event: any, context: any): Promise<string> => {
  console.log(`SNS event: ${JSON.stringify(event)}`)
  const lambdaEvent = JSON.parse(event.Records[0].Sns.Message)

  const hostedZone = process.env.HOSTED_ZONE || ''
  if (!hostedZone) throw new Error('Hosted Zone not set')
  const type = lambdaEvent.RequestType
  const source = lambdaEvent.ResourceProperties.Source
  const target = lambdaEvent.ResourceProperties.Target
  try {
    const responseData: ResponseData = {}
    switch (type) {
      case 'Create': {
        console.log(`Creating CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await Utils.changeResourceRecordSets(Route53Action.CREATE, hostedZone, source, target)
        break
      }
      case 'Update': {
        const oldsource = lambdaEvent.OldResourceProperties.Source
        const oldtarget = lambdaEvent.OldResourceProperties.Target
        console.log(`Deleting old CNAME ${oldsource} -> ${oldtarget} in hosted zone: ${hostedZone}`)
        await Utils.changeResourceRecordSets(Route53Action.DELETE, hostedZone, oldsource, oldtarget)
        console.log(`Creating new CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await Utils.changeResourceRecordSets(Route53Action.UPSERT, hostedZone, source, target)
        break
      }
      case 'Delete': {
        console.log(`Deleting CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await Utils.deleteRecord(source, target, hostedZone)
        break
      }
      default:
        console.error(`Unexpected Request Type: ${type}`)
        throw new Error('Unexpected Request Type')
    }
    console.log('Route53 successfully updated')
    const responseStatus = 'SUCCESS'
    return send(lambdaEvent, context, responseStatus, responseData)
  } catch (error) {
    console.error(`Error: ${error}`)
    const responseStatus = 'FAILED'
    const responseData = {}
    return send(lambdaEvent, context, responseStatus, responseData)
  }
}
