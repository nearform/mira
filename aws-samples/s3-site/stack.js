"use strict";
/**
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_cloudfront_s3_1 = require("@aws-solutions-constructs/aws-cloudfront-s3");
const lambda = __importStar(require("@aws-cdk/aws-lambda"));
const custom_resources_1 = require("@aws-cdk/custom-resources");
const aws_cloudformation_1 = require("@aws-cdk/aws-cloudformation");
const aws_iam_1 = require("@aws-cdk/aws-iam");
class S3StaticWebsiteStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, 'DefaultStack', props);
        const sourceBucket = 'wildrydes-us-east-1';
        const sourcePrefix = 'WebApplication/1_StaticWebHosting/website/';
        const construct = new aws_cloudfront_s3_1.CloudFrontToS3(this, 'CloudFrontToS3', {});
        const targetBucket = construct.s3Bucket.bucketName;
        const lambdaFunc = new lambda.Function(this, 'copyObjHandler', {
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'copy_s3_objects.on_event',
            code: lambda.Code.fromAsset(`${__dirname}/lambda`),
            timeout: core_1.Duration.minutes(5),
            initialPolicy: [
                new aws_iam_1.PolicyStatement({
                    actions: ["s3:GetObject",
                        "s3:ListBucket"],
                    resources: [`arn:aws:s3:::${sourceBucket}`,
                        `arn:aws:s3:::${sourceBucket}/${sourcePrefix}*`]
                }),
                new aws_iam_1.PolicyStatement({
                    actions: ["s3:ListBucket",
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:PutObjectAcl",
                        "s3:PutObjectVersionAcl",
                        "s3:DeleteObject",
                        "s3:DeleteObjectVersion",
                        "s3:CopyObject"],
                    resources: [`arn:aws:s3:::${targetBucket}`,
                        `arn:aws:s3:::${targetBucket}/*`]
                }),
            ]
        });
        const customResourceProvider = new custom_resources_1.Provider(this, 'CustomResourceProvider', {
            onEventHandler: lambdaFunc
        });
        new aws_cloudformation_1.CustomResource(this, 'CustomResource', {
            provider: customResourceProvider,
            properties: {
                SourceBucket: sourceBucket,
                SourcePrefix: sourcePrefix,
                Bucket: targetBucket
            }
        });
        new core_1.CfnOutput(this, 'websiteURL', {
            value: 'https://' + construct.cloudFrontWebDistribution.domainName
        });
    }
}
exports.default = S3StaticWebsiteStack;
//# sourceMappingURL=stack.js.map