"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateManager = void 0;
const core_1 = require("@aws-cdk/core");
const aws_sns_1 = require("@aws-cdk/aws-sns");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const assets_1 = require("@aws-cdk/assets");
const aws_lambda_event_sources_1 = require("@aws-cdk/aws-lambda-event-sources");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const stack_1 = require("../../../stack");
const mira_config_1 = require("../../../../config/mira-config");
// interface CertificateManagerProps {
//   readonly environment: string
// }
const path_1 = __importDefault(require("path"));
class CertificateManager extends stack_1.MiraStack {
    // constructor (parent: Construct, props: CertificateManagerProps) {
    constructor(parent) {
        const id = mira_config_1.MiraConfig.getBaseStackName('CertificateManager');
        super(parent, id);
        const account = mira_config_1.MiraConfig.getEnvironment();
        const { hostedZoneId } = mira_config_1.MiraConfig.getDomainConfig();
        if (!hostedZoneId) {
            throw new Error('Cannot find hostedZoneId in config.');
        }
        const allowedPrincipals = mira_config_1.MiraConfig.getDomainAllowedPrincipals().map(account => new aws_iam_1.AccountPrincipal(account.env.account));
        const code = new aws_lambda_1.AssetCode(path_1.default.join(__dirname, '..', '..', '..', '..', 'lambdas'), {
            follow: assets_1.FollowMode.ALWAYS
        });
        const DomainManagerRole = new aws_iam_1.Role(this, 'Route53ManagerRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com')
        });
        DomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
            actions: ['route53:ChangeResourceRecordSets']
        }));
        DomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: ['*'],
            actions: ['acm:RequestCertificate', 'acm:DescribeCertificate', 'acm:DeleteCertificate', 'acm:ListCertificates']
        }));
        DomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: ['*'],
            actions: ['route53:GetChange']
        }));
        DomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: [`arn:aws:iam::${account.env.account}:role/${mira_config_1.MiraConfig.getBaseStackName('DomainManager-Role')}`],
            actions: ['sts:AssumeRole']
        }));
        DomainManagerRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
        const certificateSubscriptionTopic = new aws_sns_1.Topic(this, 'CertificateSubscriptionTopic', {
            displayName: 'Certificate Subscription Topic',
            topicName: mira_config_1.MiraConfig.getBaseStackName('CertificateSubscriptionTopic')
        });
        certificateSubscriptionTopic.addToResourcePolicy(new aws_iam_1.PolicyStatement({
            principals: allowedPrincipals,
            effect: aws_iam_1.Effect.ALLOW,
            resources: [certificateSubscriptionTopic.topicArn],
            actions: ['sns:Publish']
        }));
        const CertificateManagerLambda = new aws_lambda_1.SingletonFunction(this, 'CertificateManagerLambda', {
            code,
            handler: 'certificate-manager.handler',
            runtime: aws_lambda_1.Runtime.NODEJS_10_X,
            timeout: core_1.Duration.minutes(15),
            uuid: 'dfb3da1c-591a-4225-a327-d56a74823a5e',
            environment: {
                HOSTED_ZONE: hostedZoneId
            },
            role: DomainManagerRole
        });
        CertificateManagerLambda.addEventSource(new aws_lambda_event_sources_1.SnsEventSource(certificateSubscriptionTopic));
        new core_1.CfnOutput(this, 'certificateSubscriptionTopicArn', {
            value: certificateSubscriptionTopic.topicArn
        });
    }
}
exports.CertificateManager = CertificateManager;
//# sourceMappingURL=index.js.map