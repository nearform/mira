"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route53Manager = void 0;
const core_1 = require("@aws-cdk/core");
const aws_sns_1 = require("@aws-cdk/aws-sns");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const assets_1 = require("@aws-cdk/assets");
const aws_lambda_event_sources_1 = require("@aws-cdk/aws-lambda-event-sources");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const mira_config_1 = require("../../../../config/mira-config");
const path_1 = __importDefault(require("path"));
const stack_1 = require("../../../stack");
class Route53Manager extends stack_1.MiraStack {
    constructor(parent) {
        const id = mira_config_1.MiraConfig.getBaseStackName('Route53Manager');
        super(parent, id);
        const account = mira_config_1.MiraConfig.getEnvironment();
        const { hostedZoneId } = mira_config_1.MiraConfig.getDomainConfig();
        if (!hostedZoneId) {
            throw new Error('Cannot find hostedZoneId in config.');
        }
        const allowedPrincipals = mira_config_1.MiraConfig.getDomainAllowedPrincipals().map(account => new aws_iam_1.AccountPrincipal(account.env.account));
        const domainSubscriptionTopic = new aws_sns_1.Topic(this, 'DomainSubscriptionTopic', {
            displayName: 'Domain Subscription Topic',
            topicName: mira_config_1.MiraConfig.getBaseStackName(`${account.name}-DomainSubscriptionTopic`)
        });
        domainSubscriptionTopic.addToResourcePolicy(new aws_iam_1.PolicyStatement({
            principals: allowedPrincipals,
            effect: aws_iam_1.Effect.ALLOW,
            resources: [domainSubscriptionTopic.topicArn],
            actions: ['sns:Publish']
        }));
        const code = new aws_lambda_1.AssetCode(path_1.default.join(__dirname, '..', '..', '..', '..', 'lambdas'), {
            follow: assets_1.FollowMode.ALWAYS
        });
        const permissionsBoundary = aws_iam_1.ManagedPolicy.fromManagedPolicyName(this, 'Route53PermissionsBoundary', mira_config_1.MiraConfig.calculateSharedResourceName('Route53ManagerPolicyBoundary'));
        const DomainManagerRole = new aws_iam_1.Role(this, 'Route53ManagerRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
            permissionsBoundary
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
            actions: ['route53:GetChange', 'route53:ListResourceRecordSets']
        }));
        DomainManagerRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
        const Route53ManagerLambda = new aws_lambda_1.SingletonFunction(this, 'Route53ManagerLambda', {
            code,
            handler: 'route53-manager.handler',
            runtime: aws_lambda_1.Runtime.NODEJS_10_X,
            timeout: core_1.Duration.minutes(5),
            uuid: '934dd096-1586-46c4-92a0-0dd1239e993f',
            environment: {
                HOSTED_ZONE: hostedZoneId
            },
            role: DomainManagerRole
        });
        Route53ManagerLambda.addEventSource(new aws_lambda_event_sources_1.SnsEventSource(domainSubscriptionTopic));
        new core_1.CfnOutput(this, 'domainSubscriptionTopicArn', {
            value: domainSubscriptionTopic.topicArn
        });
        const allowedCompositePrincipals = new aws_iam_1.CompositePrincipal(...mira_config_1.MiraConfig
            .getDomainAllowedPrincipals()
            .map(account => new aws_iam_1.AccountPrincipal(account.env.account)));
        const CrossAccountDomainManagerRole = new aws_iam_1.Role(this, 'CrossAccountDomainManagerRole', {
            assumedBy: allowedCompositePrincipals,
            roleName: mira_config_1.MiraConfig.getBaseStackName('DomainManager-Role'),
            permissionsBoundary
        });
        CrossAccountDomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
            actions: ['route53:ChangeResourceRecordSets']
        }));
        CrossAccountDomainManagerRole.addToPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            resources: ['*'],
            actions: ['route53:GetChange']
        }));
        new core_1.CfnOutput(this, 'CrossAccountDomainManagerRoleArn', {
            value: CrossAccountDomainManagerRole.roleArn
        });
    }
}
exports.Route53Manager = Route53Manager;
//# sourceMappingURL=index.js.map