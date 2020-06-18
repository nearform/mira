import { sendResponse } from '../../utils/send-response'
import { IAM } from 'aws-sdk'

const iam = new IAM()

export const handler = async (event: any): Promise<void> => {
  console.log(JSON.stringify(event, null, 2))

  /**
   * See the AWS documentation for more information passed in the request for a custom resource.
   *
   * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
   */
  const UserName = event.ResourceProperties.UserName
  const SSHPublicKeyBody = event.ResourceProperties.SSHPublicKeyBody

  let status = 'SUCCESS'
  let reason = ''
  let SSHPublicKeyId = ''

  if (!UserName || !SSHPublicKeyBody) {
    status = 'FAILED'
    reason = 'UserName and SSHPublicKeyBody required'
  }

  if (event.RequestType === 'Create') {
    try {
      const rsp = await iam.uploadSSHPublicKey({
        UserName,
        SSHPublicKeyBody
      }).promise()
      SSHPublicKeyId = rsp.SSHPublicKey?.SSHPublicKeyId || ''
      console.log(`uploaded key: ${SSHPublicKeyId}`)
    } catch (err) {
      console.log(err)
      reason = `Unable to add ssh key for user ${UserName}`
      status = 'FAILED'
    }
  } else if (event.RequestType === 'Update') {
    try {
      const keys = await iam.listSSHPublicKeys({
        UserName
      }).promise()
      SSHPublicKeyId = (keys.SSHPublicKeys && keys.SSHPublicKeys[0].SSHPublicKeyId) || ''
      console.log('keys listed')
      if (SSHPublicKeyId) {
        await iam.updateSSHPublicKey({
          UserName,
          Status: 'Inactive',
          SSHPublicKeyId
        }).promise()
        console.log('deactivated key')
        await iam.deleteSSHPublicKey({
          UserName,
          SSHPublicKeyId
        }).promise()
        console.log('deleted key')
        await iam.uploadSSHPublicKey({
          UserName,
          SSHPublicKeyBody
        }).promise()
        console.log('uploaded the new key')
      } else {
        console.log('no keys found to update')
      }
    } catch (err) {
      console.log(err)
      reason = `Unable to update ssh key for user ${UserName}`
      status = 'FAILED'
    }
  } else {
    try {
      const keys = await iam.listSSHPublicKeys({
        UserName
      }).promise()
      SSHPublicKeyId = (keys.SSHPublicKeys && keys.SSHPublicKeys[0].SSHPublicKeyId) || ''
      if (SSHPublicKeyId) {
        await iam.updateSSHPublicKey({
          UserName,
          Status: 'Inactive',
          SSHPublicKeyId
        }).promise()
        await iam.deleteSSHPublicKey({
          UserName,
          SSHPublicKeyId
        }).promise()
      } else {
        console.log('no keys found to update')
      }
    } catch (err) {
      console.log(err)
      reason = `Unable to delete ssh key for user ${UserName}`
      status = 'FAILED'
    }
  }

  await sendResponse({
    status: status,
    requestId: event.RequestId,
    stackId: event.StackId,
    reason: reason,
    logicalResourceId: event.LogicalResourceId,
    physicalResourceId: `${UserName}-${event.LogicalResourceId}`,
    responseUrl: event.ResponseURL,
    data: { SSHPublicKeyId }
  })
}
