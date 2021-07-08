import * as path from 'path'
import {
  Construct,
  CustomResource,
  RemovalPolicy,
  Duration
} from '@aws-cdk/core'
import { Provider } from '@aws-cdk/custom-resources'

import { Bucket, BucketProps } from '@aws-cdk/aws-s3'
import { SingletonFunction, Runtime, Code } from '@aws-cdk/aws-lambda'

/**
 * A construct representing an AutoDeleteBucket.
 *
 * This construct creates an S3 bucket that will be automatically
 * emptied before the bucket itself is destroyed. This prevents
 * Cloud Formation failing to destroy a stack when existing S3 resources
 * remain.
 *
 */
export class AutoDeleteBucket extends Bucket {
  /**
   * @param {BucketProps} [props={}] - Supports the same S3 bucket properties listed in [AWS S3 documentation](https://docs.aws.amazon.com/cdk/api/latest/typescript/api/aws-s3/bucket.html)
   */
  constructor (scope: Construct, id: string, props: BucketProps = {}) {
    if (props.removalPolicy && props.removalPolicy !== RemovalPolicy.DESTROY) {
      throw new Error('"removalPolicy" must be DESTROY')
    }

    super(scope, id, {
      ...props,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const lambda = new SingletonFunction(this, 'AutoDeleteBucketLambda', {
      uuid: 'ae8b2ff4-9aea-4394-aa32-7a4fe1184635',
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset(
        path.join(__dirname, '../../custom-resources/auto-delete-bucket')
      ),
      handler: 'lambda/index.handler',
      lambdaPurpose: 'AutoDeleteBucket',
      timeout: Duration.minutes(15)
    })

    this.grantRead(lambda)
    this.grantDelete(lambda)

    const provider = new Provider(this, 'AutoDeleteBucketProvider', {
      onEventHandler: lambda
    })

    new CustomResource(this, 'AutoDeleteBucket ', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::MiraAutoDeleteBucket',
      properties: {
        BucketName: this.bucketName
      }
    })
  }
}
