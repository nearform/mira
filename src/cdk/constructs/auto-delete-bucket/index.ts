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

export class AutoDeleteBucket extends Bucket {
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
      runtime: Runtime.NODEJS_10_X,
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
