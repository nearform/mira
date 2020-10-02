"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeleteBucket = void 0;
const path = __importStar(require("path"));
const core_1 = require("@aws-cdk/core");
const custom_resources_1 = require("@aws-cdk/custom-resources");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
/**
 * A construct representing an AutoDeleteBucket.
 *
 * This construct creates an S3 bucket that will be automatically
 * emptied before the bucket itself is destroyed. This prevents
 * Cloud Formation failing to destroy a stack when existing S3 resources
 * remain.
 *
 */
class AutoDeleteBucket extends aws_s3_1.Bucket {
    /**
     * @param {BucketProps} [props={}] - Supports the same S3 bucket properties listed in [AWS S3 documentation](https://docs.aws.amazon.com/cdk/api/latest/typescript/api/aws-s3/bucket.html)
     */
    constructor(scope, id, props = {}) {
        if (props.removalPolicy && props.removalPolicy !== core_1.RemovalPolicy.DESTROY) {
            throw new Error('"removalPolicy" must be DESTROY');
        }
        super(scope, id, {
            ...props,
            removalPolicy: core_1.RemovalPolicy.DESTROY
        });
        const lambda = new aws_lambda_1.SingletonFunction(this, 'AutoDeleteBucketLambda', {
            uuid: 'ae8b2ff4-9aea-4394-aa32-7a4fe1184635',
            runtime: aws_lambda_1.Runtime.NODEJS_10_X,
            code: aws_lambda_1.Code.fromAsset(path.join(__dirname, '../../custom-resources/auto-delete-bucket')),
            handler: 'lambda/index.handler',
            lambdaPurpose: 'AutoDeleteBucket',
            timeout: core_1.Duration.minutes(15)
        });
        this.grantRead(lambda);
        this.grantDelete(lambda);
        const provider = new custom_resources_1.Provider(this, 'AutoDeleteBucketProvider', {
            onEventHandler: lambda
        });
        new core_1.CustomResource(this, 'AutoDeleteBucket ', {
            serviceToken: provider.serviceToken,
            resourceType: 'Custom::MiraAutoDeleteBucket',
            properties: {
                BucketName: this.bucketName
            }
        });
    }
}
exports.AutoDeleteBucket = AutoDeleteBucket;
//# sourceMappingURL=index.js.map