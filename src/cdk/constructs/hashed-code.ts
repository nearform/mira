import { Code, CodeConfig, ResourceBindOptions } from '@aws-cdk/aws-lambda'
import { Asset, AssetOptions } from '@aws-cdk/aws-s3-assets'
import { CfnResource, Construct } from '@aws-cdk/core'

/**
 * Same as AssetCode but exposes the sourceHash: https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-lambda/lib/code.ts
 * Feature request to expose sourceHash on the official AssetCode class: https://github.com/aws/aws-cdk/issues/4901
 *
 */
export class HashedCode extends Code {
  private asset?: Asset;
  public readonly isInline = false;
  public sourceHash?: string

  constructor (public readonly path: string, private readonly options: AssetOptions = {}) {
    super()
  }

  public bind (scope: Construct): CodeConfig {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = new Asset(scope, 'Code', {
        path: this.path,
        ...this.options
      })
      this.sourceHash = this.asset.sourceHash
    }

    if (!this.asset.isZipArchive) {
      throw new Error(`Asset must be a .zip file or a directory (${this.path})`)
    }

    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey
      }
    }
  }

  public bindToResource (resource: CfnResource, options: ResourceBindOptions = { }): void {
    if (!this.asset) {
      throw new Error('bindToResource() must be called after bind()')
    }

    const resourceProperty = options.resourceProperty || 'Code'

    this.asset.addResourceMetadata(resource, resourceProperty)
  }
}
