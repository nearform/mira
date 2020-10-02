"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashedCode = void 0;
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_s3_assets_1 = require("@aws-cdk/aws-s3-assets");
/**
 * Same as AssetCode but exposes the sourceHash: https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-lambda/lib/code.ts
 * Feature request to expose sourceHash on the official AssetCode class: https://github.com/aws/aws-cdk/issues/4901
 *
 */
class HashedCode extends aws_lambda_1.Code {
    constructor(path, options = {}) {
        super();
        this.path = path;
        this.options = options;
        this.isInline = false;
    }
    bind(scope) {
        // If the same AssetCode is used multiple times, retain only the first instantiation.
        if (!this.asset) {
            this.asset = new aws_s3_assets_1.Asset(scope, 'Code', {
                path: this.path,
                ...this.options
            });
            this.sourceHash = this.asset.sourceHash;
        }
        if (!this.asset.isZipArchive) {
            throw new Error(`Asset must be a .zip file or a directory (${this.path})`);
        }
        return {
            s3Location: {
                bucketName: this.asset.s3BucketName,
                objectKey: this.asset.s3ObjectKey
            }
        };
    }
    bindToResource(resource, options = {}) {
        if (!this.asset) {
            throw new Error('bindToResource() must be called after bind()');
        }
        const resourceProperty = options.resourceProperty || 'Code';
        this.asset.addResourceMetadata(resource, resourceProperty);
    }
}
exports.HashedCode = HashedCode;
//# sourceMappingURL=hashed-code.js.map