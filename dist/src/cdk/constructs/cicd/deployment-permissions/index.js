"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentPermissions = void 0;
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const app_1 = require("../../../app");
const mira_config_1 = require("../../../../config/mira-config");
const utils_1 = require("../../config/utils");
class DeploymentPermissions extends core_1.Stack {
    constructor(parent, props = { env: 'dev' }) {
        const name = utils_1.getBaseStackName('CICDPermissions');
        const account = mira_config_1.MiraConfig.getEnvironment(props.env);
        super(parent, name, { env: account.env });
        const baseProject = app_1.MiraApp.getBaseStackName();
        this.role = new aws_iam_1.Role(this, `DeployProjectRole-${account.name}`, {
            assumedBy: new aws_iam_1.AccountPrincipal(mira_config_1.MiraConfig.getCICDConfig().account.env.account),
            roleName: utils_1.getDeployProjectRoleName(account.name)
        });
        // Policy statements needed for CDK to deploy any template.
        this.role.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'cloudformation:CreateChangeSet',
                'cloudformation:DeleteChangeSet',
                'cloudformation:DescribeChangeSet',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeStacks',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:GetTemplate'
            ],
            resources: [
                `arn:aws:cloudformation:${account.env.region}:${account.env.account}:stack/CDKToolkit/*`
            ]
        }));
        this.role.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'sts:AssumeRole'
            ],
            resources: ['*']
        }));
        // Actions to start the build/deploy
        this.role.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'cloudformation:CreateChangeSet',
                'cloudformation:DeleteChangeSet',
                'cloudformation:CreateStack',
                'cloudformation:DeleteStack',
                'cloudformation:DescribeChangeSet',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeStacks',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:GetTemplate',
                'cloudformation:UpdateStack',
                'cloudformation:ValidateTemplate'
            ],
            resources: [
                `arn:aws:cloudformation:${account.env.region}:${account.env.account}:stack/${baseProject}-*`
            ]
        }));
        this.role.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                's3:DeleteObject',
                's3:GetObject',
                's3:ListBucket',
                's3:PutObject',
                's3:getBucketLocation'
            ],
            resources: [
                'arn:aws:s3:::cdktoolkit-stagingbucket-*'
            ]
        }));
    }
}
exports.DeploymentPermissions = DeploymentPermissions;
//# sourceMappingURL=index.js.map