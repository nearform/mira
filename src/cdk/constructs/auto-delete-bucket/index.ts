import * as path from 'path'
import { Construct, RemovalPolicy, Duration } from '@aws-cdk/core'
import {
  CustomResource,
  CustomResourceProvider
} from '@aws-cdk/aws-cloudformation'

import { Bucket, BucketProps } from '@aws-cdk/aws-s3'
import { SingletonFunction, Runtime, Code } from '@aws-cdk/aws-lambda'

export interface AutoDeleteBucketProps extends BucketProps {
  customProperty?: string
}

export class AutoDeleteBucket extends Bucket {
  constructor (scope: Construct, id: string, props: AutoDeleteBucketProps = {}) {
    if (props.removalPolicy && props.removalPolicy !== RemovalPolicy.DESTROY) {
      // TODO: should we do this? better error?
      throw new Error(
        '"removalPolicy" should be DESTROY. Consider using aws-s3 bucket'
      )
    }

    super(scope, id, {
      ...props,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const lambda = new SingletonFunction(this, 'UploadPublicSshHandler', {
      uuid: 'ae8b2ff4-9aea-4394-aa32-7a4fe1184635',
      runtime: Runtime.NODEJS_10_X,
      code: Code.fromAsset(path.join(__dirname, '../../custom-resources')),
      handler: 'auto-delete-bucket/lambda/index.handler',
      lambdaPurpose: 'AutoDeleteBucket',
      timeout: Duration.minutes(15)
    })

    this.grantRead(lambda)
    this.grantDelete(lambda)

    // TODO: .fromLambda vs .lambda?
    const provider = CustomResourceProvider.fromLambda(lambda)

    new CustomResource(this, 'AutoDeleteBucket ', {
      provider,
      resourceType: 'Custom::MiraAutoDeleteBucket',
      properties: {
        BucketName: this.bucketName
      }
    })
  }
}
