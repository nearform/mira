import '@aws-cdk/assert/jest'
import { Stack, RemovalPolicy } from '@aws-cdk/core'

import { AutoDeleteBucket } from '.'

describe('Auto-delete bucket', () => {
  it('throws an error if wrong removalPolicy is passed as a prop', () => {
    const stack = new Stack()

    expect(() => {
      new AutoDeleteBucket(stack, 'ADB', {
        removalPolicy: RemovalPolicy.RETAIN
      })
    }).toThrowError('"removalPolicy" must be DESTROY')
  })

  it('creates the bucket and all necesarry resources', () => {
    const stack = new Stack()
    new AutoDeleteBucket(stack, 'ADB')

    expect(stack).toHaveResource('AWS::S3::Bucket')

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Handler: 'lambda/index.handler',
      Runtime: 'nodejs10.x',
      Timeout: 900
    })

    // TODO: more fine grained test for policies
    // (needs @aws-cdk/assert support for arrayLike and objectLike)
    expect(stack).toHaveResource('AWS::IAM::Policy')
    //   expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
    //     PolicyDocument: {
    //       Statement: [
    //         {
    //           Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
    //           Effect: 'Allow'
    //         }
    //       ]
    //     }
    //   })
    //   expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
    //     PolicyDocument: {
    //       Statement: [
    //         {
    //           Action: ['s3:DeleteObject'],
    //           Effect: 'Allow'
    //         }
    //       ]
    //     }
    //   })
    // })

    expect(stack).toHaveResourceLike('Custom::MiraAutoDeleteBucket')
  })
})
