import { HashedCode } from './hashed-code'
import { CfnResource, Stack, CfnResourceProps } from '@aws-cdk/core'

jest.mock('@aws-cdk/aws-s3-assets', () => ({
  ...jest.requireActual('@aws-cdk/aws-s3-assets'),
  Asset: jest.fn().mockImplementationOnce(() => ({})).mockImplementation(() => ({
    isZipArchive: true,
    s3BucketName: 'test-bucket',
    s3ObjectKey: 'test-key',
    addResourceMetadata: jest.fn()
  }))
}))

describe('HashedCode', () => {
  test('calling bindToResource before bind throws error', () => {
    const stack = new Stack()
    const cfn = { type: 'type' } as CfnResourceProps
    const resource = new CfnResource(stack, 'id', cfn)

    expect(() => {
      new HashedCode('path').bindToResource(resource, {})
    }).toThrowError('bindToResource() must be called after bind()')
  })

  test('calling bind and asset with no isZipArchive throws error', () => {
    const stack = new Stack()

    expect(() => {
      new HashedCode('path').bind(stack)
    }).toThrowError('Asset must be a .zip file or a directory (path)')
  })

  test('calling bind returns correct Asset props', () => {
    const stack = new Stack()
    const hashedCodeInstance = new HashedCode('path')

    expect(() => {
      hashedCodeInstance.bind(stack)
    }).not.toThrowError()
    expect(hashedCodeInstance.bind(stack).s3Location?.bucketName).toBe('test-bucket')
    expect(hashedCodeInstance.bind(stack).s3Location?.objectKey).toBe('test-key')
  })

  test('calling bind and than bindToResource', () => {
    const stack = new Stack()
    const cfn = { type: 'type' } as CfnResourceProps
    const resource = new CfnResource(stack, 'id', cfn)

    const hashedCodeInstance = new HashedCode('path')

    hashedCodeInstance.bind(stack)
    hashedCodeInstance.bindToResource(resource)
    hashedCodeInstance.bindToResource(resource, { resourceProperty: 'Test' })
  })
})
