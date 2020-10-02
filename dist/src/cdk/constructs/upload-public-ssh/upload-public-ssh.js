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
exports.UploadPublicSsh = void 0;
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const core_1 = require("@aws-cdk/core");
const aws_cloudformation_1 = require("@aws-cdk/aws-cloudformation");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const path = __importStar(require("path"));
class UploadPublicSsh extends core_1.Resource {
    constructor(scope, id, props) {
        super(scope, id);
        const role = new aws_iam_1.Role(this, 'managePublicSshKeys', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com')
        });
        role.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: [`arn:aws:iam::*:user/${props.userName}`],
            actions: [
                'iam:uploadSSHPublicKey',
                'iam:updateSSHPublicKey',
                'iam:getSSHPublicKey',
                'iam:deleteSSHPublicKey',
                'iam:listSSHPublicKeys'
            ]
        }));
        role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
        const lambda = new aws_lambda_1.SingletonFunction(this, 'UploadPublicSshHandler', {
            uuid: 'f7c82053-f5e1-47f7-87de-2b304c759d19',
            runtime: aws_lambda_1.Runtime.NODEJS_10_X,
            code: aws_lambda_1.Code.fromAsset(path.join(__dirname, '../../custom-resources')),
            handler: 'upload-public-ssh/lambda/index.handler',
            lambdaPurpose: 'UploadPublicSsh',
            timeout: core_1.Duration.minutes(15),
            role
        });
        const provider = aws_cloudformation_1.CustomResourceProvider.fromLambda(lambda);
        const ssh = new aws_cloudformation_1.CustomResource(this, 'UploadPublicSsh', {
            provider,
            resourceType: 'Custom::UploadPublicSsh',
            properties: {
                SSHPublicKeyBody: props.publicKey,
                UserName: props.userName
            }
        });
        this.sshPublicKeyId = ssh.getAttString('SSHPublicKeyId');
    }
}
exports.UploadPublicSsh = UploadPublicSsh;
//# sourceMappingURL=upload-public-ssh.js.map