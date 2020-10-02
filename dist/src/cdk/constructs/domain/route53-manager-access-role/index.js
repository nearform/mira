"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route53ManagerAccessRoleStack = void 0;
const aws_iam_1 = require("@aws-cdk/aws-iam");
const mira_config_1 = require("../../../../config/mira-config");
const stack_1 = require("../../../stack");
class Route53ManagerAccessRoleStack extends stack_1.MiraStack {
    constructor(parent) {
        super(parent, Route53ManagerAccessRoleStack.name);
        const { hostedZoneId } = mira_config_1.MiraConfig.getDomainConfig();
        if (!hostedZoneId) {
            throw new Error('Cannot find hostedZoneId in config.');
        }
        new aws_iam_1.ManagedPolicy(this, 'permissionBoundaryPolicy', {
            managedPolicyName: mira_config_1.MiraConfig.calculateSharedResourceName('Route53ManagerPolicyBoundary'),
            description: 'Boundary that defines what action can be performed by the Route53Manager stack resources',
            statements: [
                new aws_iam_1.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                        'route53:GetChange'
                    ]
                }),
                new aws_iam_1.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ]
                }),
                new aws_iam_1.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
                    actions: [
                        'route53:ChangeResourceRecordSets',
                        'route53:ListResourceRecordSets'
                    ]
                })
            ]
        });
    }
}
exports.Route53ManagerAccessRoleStack = Route53ManagerAccessRoleStack;
//# sourceMappingURL=index.js.map