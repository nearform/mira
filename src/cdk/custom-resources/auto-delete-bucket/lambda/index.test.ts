const mockDeleteBucket = jest.fn()
const mockSendResponse = jest.fn()

jest.mock('../utils/delete-bucket', () => ({
  deleteBucket: mockDeleteBucket
}))

jest.mock('../utils/send-response', () => ({
  sendResponse: mockSendResponse
}))

const { handler } = require('.')

const eventBase = {
  ResponseURL: 'ResponseURL',
  LogicalResourceId: 'LogicalResourceId',
  StackId: 'StackId',
  RequestId: 'RequestId',
  ResourceProperties: { BucketName: 'testBucket' }
}

describe('auto-delete bucket lambda', () => {
  beforeEach(() => {
    mockDeleteBucket.mockClear()
    mockSendResponse.mockClear()
  })

  it('fails if bucket name is not provided no matter the request type', async () => {
    await handler({
      ...eventBase,
      RequestType: 'Create',
      ResourceProperties: { test: 'test' }
    })

    expect(mockDeleteBucket).not.toHaveBeenCalled()
    expect(mockSendResponse).toHaveBeenCalledTimes(1)
    expect(mockSendResponse).toHaveBeenCalledWith('ResponseURL', {
      status: 'FAILED',
      reason: 'BucketName is required',
      physicalResourceId: 'LogicalResourceId',
      stackId: 'StackId',
      requestId: 'RequestId',
      logicalResourceId: 'LogicalResourceId',
      data: { test: 'test' }
    })
  })

  it('runs without doing anything if the request type is not delete', async () => {
    await handler({
      ...eventBase,
      RequestType: 'Update'
    })

    expect(mockDeleteBucket).not.toHaveBeenCalled()
    expect(mockSendResponse).toHaveBeenCalledTimes(1)
    expect(mockSendResponse).toHaveBeenCalledWith('ResponseURL', {
      status: 'SUCCESS',
      reason: '',
      physicalResourceId: 'LogicalResourceId',
      stackId: 'StackId',
      requestId: 'RequestId',
      logicalResourceId: 'LogicalResourceId',
      data: { BucketName: 'testBucket' }
    })
  })

  it('fails if delete bucket throws', async () => {
    mockDeleteBucket.mockRejectedValue('delete-bucket-error')
    await handler({
      ...eventBase,
      RequestType: 'Delete'
    })

    expect(mockDeleteBucket).toHaveBeenCalledTimes(1)
    expect(mockDeleteBucket).toHaveBeenCalledWith('testBucket')

    expect(mockSendResponse).toHaveBeenCalledTimes(1)
    expect(mockSendResponse).toHaveBeenCalledWith('ResponseURL', {
      status: 'FAILED',
      reason: 'Faild to empty bucket. delete-bucket-error',
      physicalResourceId: 'LogicalResourceId',
      stackId: 'StackId',
      requestId: 'RequestId',
      logicalResourceId: 'LogicalResourceId',
      data: { BucketName: 'testBucket' }
    })
  })

  it('runs successfully and deletes the bucket', async () => {
    mockDeleteBucket.mockResolvedValueOnce(true)
    await handler({
      ...eventBase,
      RequestType: 'Delete'
    })

    expect(mockDeleteBucket).toHaveBeenCalledTimes(1)
    expect(mockDeleteBucket).toHaveBeenCalledWith('testBucket')

    expect(mockSendResponse).toHaveBeenCalledTimes(1)
    expect(mockSendResponse).toHaveBeenCalledWith('ResponseURL', {
      status: 'SUCCESS',
      reason: '',
      physicalResourceId: 'LogicalResourceId',
      stackId: 'StackId',
      requestId: 'RequestId',
      logicalResourceId: 'LogicalResourceId',
      data: { BucketName: 'testBucket' }
    })
  })
})
