import { Construct } from '@aws-cdk/core';
import { Bucket, BucketProps } from '@aws-cdk/aws-s3';
/**
 * A construct representing an AutoDeleteBucket.
 *
 * This construct creates an S3 bucket that will be automatically
 * emptied before the bucket itself is destroyed. This prevents
 * Cloud Formation failing to destroy a stack when existing S3 resources
 * remain.
 *
 */
export declare class AutoDeleteBucket extends Bucket {
    /**
     * @param {BucketProps} [props={}] - Supports the same S3 bucket properties listed in [AWS S3 documentation](https://docs.aws.amazon.com/cdk/api/latest/typescript/api/aws-s3/bucket.html)
     */
    constructor(scope: Construct, id: string, props?: BucketProps);
}
