import { Context, SNSEvent } from 'aws-lambda'
import sendCfnResponse, { LambdaEvent, ResponseData } from './send-cfn-response'
import { createRecord, deleteRecord, upsertRecord } from './route53-record-actions'

export const handler = async (event: SNSEvent, context: Context): Promise<string> => {
  console.log(`SNS event: ${JSON.stringify(event)}`)
  const lambdaEvent = JSON.parse(event.Records[0].Sns.Message) as LambdaEvent

  try {
    const hostedZone = process.env.HOSTED_ZONE || ''
    if (!hostedZone) throw new Error('Hosted Zone not set')
    const type = lambdaEvent.RequestType
    const source = lambdaEvent.ResourceProperties.Source
    const target = lambdaEvent.ResourceProperties.Target

    const responseData: ResponseData = {}
    switch (type) {
      case 'Create': {
        console.log(`Creating CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await createRecord(hostedZone, source, target)
        break
      }
      case 'Update': {
        const oldsource = lambdaEvent.OldResourceProperties.Source
        const oldtarget = lambdaEvent.OldResourceProperties.Target
        console.log(`Deleting old CNAME ${oldsource} -> ${oldtarget} in hosted zone: ${hostedZone}`)
        await deleteRecord(hostedZone, oldsource, oldtarget)
        console.log(`Creating new CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await upsertRecord(hostedZone, source, target)
        break
      }
      case 'Delete': {
        console.log(`Deleting CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`)
        await deleteRecord(source, target, hostedZone)
        break
      }
      default:
        console.error(`Unexpected Request Type: ${type}`)
        throw new Error('Unexpected Request Type')
    }
    console.log('Route53 successfully updated')
    const responseStatus = 'SUCCESS'
    return sendCfnResponse(lambdaEvent, context, responseStatus, responseData)
  } catch (error) {
    console.error(`Error: ${error}`)
    const responseStatus = 'FAILED'
    const responseData = {}
    return sendCfnResponse(lambdaEvent, context, responseStatus, responseData)
  }
}
