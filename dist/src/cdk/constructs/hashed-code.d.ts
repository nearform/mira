import { Code, CodeConfig, ResourceBindOptions } from '@aws-cdk/aws-lambda';
import { AssetOptions } from '@aws-cdk/aws-s3-assets';
import { CfnResource, Construct } from '@aws-cdk/core';
/**
 * Same as AssetCode but exposes the sourceHash: https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-lambda/lib/code.ts
 * Feature request to expose sourceHash on the official AssetCode class: https://github.com/aws/aws-cdk/issues/4901
 *
 */
export declare class HashedCode extends Code {
    readonly path: string;
    private readonly options;
    private asset?;
    readonly isInline = false;
    sourceHash?: string;
    constructor(path: string, options?: AssetOptions);
    bind(scope: Construct): CodeConfig;
    bindToResource(resource: CfnResource, options?: ResourceBindOptions): void;
}
