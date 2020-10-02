"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cicd = void 0;
const aws_codebuild_1 = require("@aws-cdk/aws-codebuild");
const aws_codepipeline_1 = require("@aws-cdk/aws-codepipeline");
const aws_codepipeline_actions_1 = require("@aws-cdk/aws-codepipeline-actions");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_secretsmanager_1 = require("@aws-cdk/aws-secretsmanager");
const core_1 = require("@aws-cdk/core");
const aws_codecommit_1 = require("@aws-cdk/aws-codecommit");
const upload_public_ssh_1 = require("../upload-public-ssh");
const project_1 = require("@aws-cdk/aws-codebuild/lib/project");
const aws_kms_1 = require("@aws-cdk/aws-kms");
const change_case_1 = require("change-case");
const mira_config_1 = require("../../../config/mira-config");
const auto_delete_bucket_1 = require("../auto-delete-bucket");
const utils_1 = require("../config/utils");
var SourceAction;
(function (SourceAction) {
    SourceAction[SourceAction["GITHUB"] = 0] = "GITHUB";
    SourceAction[SourceAction["CODECOMMIT"] = 1] = "CODECOMMIT";
})(SourceAction || (SourceAction = {}));
class Cicd extends core_1.Stack {
    constructor(parent, props) {
        const accounts = mira_config_1.MiraConfig.getCICDAccounts();
        const id = mira_config_1.MiraConfig.getBaseStackName('Cicd');
        super(parent, id, { env: props.env });
        this.pipelineEnvironment = props.environmentVariables;
        core_1.Tags.of(this).add('StackName', this.stackName);
        const sourceOutput = new aws_codepipeline_1.Artifact();
        const encryptionKey = new aws_kms_1.Key(this, 'key', {
            enableKeyRotation: true,
            // TODO might worth exposing this property as a config value
            removalPolicy: core_1.RemovalPolicy.DESTROY
        });
        /**
         * granting admin permissions for creator of the stack.
         * This is resource-based policy so although there is '*' as a resource
         * it affects only local encryptionKey.
         */
        encryptionKey.addToResourcePolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'kms:*'
            ],
            resources: [
                '*'
            ],
            principals: [
                this.getCallerIdentity(props.callerIdentityResponse)
            ]
        }));
        const pipelineRole = new aws_iam_1.Role(this, 'PipeRole', {
            assumedBy: new aws_iam_1.ServicePrincipal('codepipeline.amazonaws.com')
        });
        /**
         * Bucket that keeps artifacts created by the CI.
         */
        const artifactBucket = new auto_delete_bucket_1.AutoDeleteBucket(this, 'artifacts', {
            encryptionKey: encryptionKey
        });
        this.pipeline = new aws_codepipeline_1.Pipeline(this, 'Pipeline', {
            artifactBucket,
            role: pipelineRole
        });
        encryptionKey.grantEncryptDecrypt(pipelineRole);
        this.pipeline.addStage({
            stageName: 'Source',
            actions: [
                this.getSourceAction(sourceOutput)
            ]
        });
        accounts.forEach((account) => {
            this.addDeployStage(account.name, sourceOutput);
        });
    }
    /**
     * Function that parse AWS.STS.getCallerIdentity and returns referenced Role or User
     * @param callerIdentityResponse
     */
    getCallerIdentity(callerIdentityResponse) {
        const callerArn = (callerIdentityResponse === null || callerIdentityResponse === void 0 ? void 0 : callerIdentityResponse.Arn) || '';
        const account = callerArn.split(':')[4];
        const identityName = callerArn.split('/')[1];
        if (callerArn.indexOf(':assumed-role') > 0) {
            const roleArn = `arn:aws:iam::${account}:role/${identityName}`;
            return aws_iam_1.Role.fromRoleArn(this, 'callerIdentity', roleArn);
        }
        else {
            return aws_iam_1.User.fromUserName(this, 'callerIdentity', identityName);
        }
    }
    getSourceAction(sourceOutput) {
        let action;
        const { branchName, gitHubTokenSecretArn, repositoryOwner, repositoryName, codeCommitUserPublicKey, provider } = mira_config_1.MiraConfig.getCICDConfig();
        const type = provider === 'codecommit' ? SourceAction.CODECOMMIT : SourceAction.GITHUB;
        if (type === SourceAction.CODECOMMIT && codeCommitUserPublicKey) {
            const technicalUser = new aws_iam_1.User(this, 'git-access-user');
            const repository = new aws_codecommit_1.Repository(this, 'Repository', {
                repositoryName: mira_config_1.MiraConfig.calculateRepositoryName(),
                description: 'Project repository'
            });
            new core_1.CfnOutput(this, 'RepositoryName', {
                value: mira_config_1.MiraConfig.calculateRepositoryName()
            });
            technicalUser.addToPolicy(new aws_iam_1.PolicyStatement({
                effect: aws_iam_1.Effect.ALLOW,
                resources: [repository.repositoryArn],
                actions: ['*']
            }));
            const uploadedSsh = new upload_public_ssh_1.UploadPublicSsh(this, 'technical-user-ssh', {
                userName: technicalUser.userName,
                publicKey: codeCommitUserPublicKey
            });
            new core_1.CfnOutput(this, 'GitUserName', {
                value: uploadedSsh.sshPublicKeyId
            });
            action = new aws_codepipeline_actions_1.CodeCommitSourceAction({
                actionName: 'Source',
                branch: branchName,
                repository,
                output: sourceOutput
            });
        }
        else if (gitHubTokenSecretArn) {
            const oAuthToken = aws_secretsmanager_1.Secret.fromSecretArn(this, 'GitHubToken', gitHubTokenSecretArn);
            action = new aws_codepipeline_actions_1.GitHubSourceAction({
                actionName: 'Source',
                branch: branchName,
                oauthToken: oAuthToken.secretValue,
                output: sourceOutput,
                owner: repositoryOwner,
                repo: repositoryName
            });
        }
        else {
            const msg = 'at least one of gitHubTokenSecretArn or codeCommitUserPublicKey not provided.';
            console.error(msg);
            throw new Error(msg);
        }
        return action;
    }
    addDeployStage(name, input) {
        const conf = mira_config_1.MiraConfig.getEnvironmentWithCiProps(name);
        const { account: { env: { account, region } } } = conf;
        const prefix = `${utils_1.getBaseStackName()}-${change_case_1.pascalCase(name)}`;
        const deployProjectRoleName = `${prefix}-CodebuildRole`;
        const role = new aws_iam_1.Role(this, deployProjectRoleName, {
            assumedBy: new aws_iam_1.ServicePrincipal('codebuild.amazonaws.com')
        });
        role.addToPolicy(new aws_iam_1.PolicyStatement({
            actions: [
                'sts:AssumeRole',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogGroups',
                'kms:decrypt'
            ],
            resources: ['*']
        }));
        const { buildspecFile } = mira_config_1.MiraConfig.getCICDConfig();
        const projectEnvVariables = {
            ROLE_NAME: { type: project_1.BuildEnvironmentVariableType.PLAINTEXT, value: utils_1.getDeployProjectRoleName(name) },
            ROLE_ARN: { type: project_1.BuildEnvironmentVariableType.PLAINTEXT, value: this.getDeployRoleArn(name, account) },
            ACCOUNT_NUMBER: { type: project_1.BuildEnvironmentVariableType.PLAINTEXT, value: account },
            REGION: { type: project_1.BuildEnvironmentVariableType.PLAINTEXT, value: region },
            ENVIRONMENT: { type: project_1.BuildEnvironmentVariableType.PLAINTEXT, value: name }
        };
        this.pipelineEnvironment.forEach((keyValue) => {
            projectEnvVariables[keyValue.key] = {
                type: project_1.BuildEnvironmentVariableType.PLAINTEXT,
                value: keyValue.value
            };
        });
        const project = new aws_codebuild_1.PipelineProject(this, `${utils_1.getBaseStackName()}-${name}Deploy`, {
            buildSpec: aws_codebuild_1.BuildSpec.fromSourceFilename(buildspecFile),
            encryptionKey: this.pipeline.artifactBucket.encryptionKey,
            environmentVariables: projectEnvVariables,
            role
        });
        if (conf.requireManualApproval) {
            this.pipeline.addStage({
                actions: [
                    new aws_codepipeline_actions_1.ManualApprovalAction({ actionName: 'Promote' })
                ],
                stageName: 'Promote'
            });
        }
        this.pipeline.addStage({
            actions: [
                new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: `${utils_1.getBaseStackName()}-${name}Deploy`,
                    input,
                    project
                })
            ],
            stageName: `${utils_1.getBaseStackName()}-${name}Deploy`
        });
    }
    getDeployRoleArn(environment, account) {
        return `arn:aws:iam::${account}:role/${utils_1.getDeployProjectRoleName(environment)}`;
    }
}
exports.Cicd = Cicd;
//# sourceMappingURL=index.js.map