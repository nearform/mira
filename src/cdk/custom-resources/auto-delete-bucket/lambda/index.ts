import { deleteBucket } from '../utils/delete-bucket'
import { sendResponse } from '../utils/send-response'

/**
 * See the AWS documentation for more information passed in the request for a custom resource.
 *
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
 */
export interface CustomResourceProviderRequest<T1, T2> {
  RequestType: 'Create' | 'Update' | 'Delete'
  ResponseURL: string
  StackId: string
  RequestId: string
  ResourceType: string
  LogicalResourceId: string
  ResourceProperties: T1
  OldResourceProperties: T2
}

interface Properties {
  BucketName: string
}

export const handler = async (
  event: CustomResourceProviderRequest<Properties, Properties>
): Promise<void> => {
  const { RequestType, ResourceProperties: { BucketName } = {} } = event

  let status = 'SUCCESS'
  let reason = ''

  if (!BucketName) {
    status = 'FAILED'
    reason = 'BucketName is required'
  }

  if (BucketName && RequestType === 'Delete') {
    try {
      await deleteBucket(BucketName)
    } catch (err) {
      status = 'FAILED'
      reason = `Faild to empty bucket. ${err}`
    }
  }

  await sendResponse(event.ResponseURL, {
    status,
    reason,
    physicalResourceId: event.LogicalResourceId,
    stackId: event.StackId,
    requestId: event.RequestId,
    logicalResourceId: event.LogicalResourceId,
    data: event.ResourceProperties
  })
}
