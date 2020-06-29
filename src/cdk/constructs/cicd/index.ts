import { BuildSpec, CommonProjectProps, PipelineProject } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import {
  CodeBuildAction,
  CodeCommitSourceAction,
  GitHubSourceAction,
  ManualApprovalAction
} from '@aws-cdk/aws-codepipeline-actions'
import { Effect, PolicyStatement, Role, ServicePrincipal, User, IPrincipal } from '@aws-cdk/aws-iam'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { CfnOutput, Construct, Stack, StackProps, Tag } from '@aws-cdk/core'
import { Repository } from '@aws-cdk/aws-codecommit'
import { IAction } from '@aws-cdk/aws-codepipeline/lib/action'
import { UploadPublicSsh } from '../upload-public-ssh'
import { BuildEnvironmentVariableType } from '@aws-cdk/aws-codebuild/lib/project'
import { Key } from '@aws-cdk/aws-kms'
import * as aws from 'aws-sdk'
import { getBaseStackName, getDeployProjectRoleName } from '../config/utils'
import { MiraConfig } from '../../../config/mira-config'
import { pascalCase } from 'change-case'
import { AutoDeleteBucket } from '../auto-delete-bucket'

export interface PipelineEnvironmentVariable {
  key: string
  value: string
}
export interface CicdProps extends StackProps {
  callerIdentityResponse: aws.STS.Types.GetCallerIdentityResponse
  environmentVariables: PipelineEnvironmentVariable[]
}

enum SourceAction {
  GITHUB,
  CODECOMMIT
}

export class Cicd extends Stack {
  private readonly pipeline: Pipeline
  private readonly pipelineEnvironment: PipelineEnvironmentVariable[]

  constructor (parent: Construct, props: CicdProps) {
    const accounts = MiraConfig.getCICDAccounts()
    const id = MiraConfig.getBaseStackName('Cicd')

    super(parent, id, { env: props.env })
    this.pipelineEnvironment = props.environmentVariables

    Tag.add(this, 'StackName', this.stackName)

    const sourceOutput = new Artifact()

    const encryptionKey = new Key(this, 'key', {
      enableKeyRotation: true
    })

    /**
     * granting admin permissions for creator of the stack.
     * This is resource-based policy so although there is '*' as a resource
     * it affects only local encryptionKey.
     */
    encryptionKey.addToResourcePolicy(new PolicyStatement({
      actions: [
        'kms:*'
      ],
      resources: [
        '*'
      ],
      principals: [
        this.getCallerIdentity(props.callerIdentityResponse)
      ]
    }))

    const pipelineRole = new Role(this, 'PipeRole', {
      assumedBy: new ServicePrincipal('codepipeline.amazonaws.com')
    })

    /**
     * Bucket that keeps artifacts created by the CI.
     */
    const artifactBucket = new AutoDeleteBucket(this, 'artifacts', {
      encryptionKey: encryptionKey
    })
    this.pipeline = new Pipeline(this, 'Pipeline', {
      artifactBucket,
      role: pipelineRole
    })

    encryptionKey.grantEncryptDecrypt(pipelineRole)

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        this.getSourceAction(sourceOutput)
      ]
    })
    accounts.forEach((account: any) => {
      this.addDeployStage(account.name, sourceOutput)
    })
  }

  /**
   * Function that parse AWS.STS.getCallerIdentity and returns referenced Role or User
   * @param callerIdentityResponse
   */
  private getCallerIdentity (callerIdentityResponse: AWS.STS.Types.GetCallerIdentityResponse): IPrincipal {
    const callerArn = callerIdentityResponse.Arn!
    const account = callerArn.split(':')[4]
    const identityName = callerArn.split('/')[1]
    if (callerArn.indexOf(':assumed-role') > 0) {
      const roleArn = `arn:aws:iam::${account}:role/${identityName}`
      return Role.fromRoleArn(this, 'callerIdentity', roleArn)
    } else {
      return User.fromUserName(this, 'callerIdentity', identityName)
    }
  }

  private getSourceAction (sourceOutput: Artifact): IAction {
    let action: IAction
    const {
      branchName,
      gitHubTokenSecretArn,
      repositoryOwner,
      repositoryName,
      codeCommitUserPublicKey,
      provider
    } = MiraConfig.getCICDConfig()
    const type = provider === 'codecommit' ? SourceAction.CODECOMMIT : SourceAction.GITHUB
    if (type === SourceAction.CODECOMMIT && codeCommitUserPublicKey) {
      const technicalUser = new User(this, 'git-access-user')
      const repository = new Repository(this, 'Repository', {
        repositoryName: MiraConfig.calculateRepositoryName(),
        description: 'Project repository'
      })
      new CfnOutput(this, 'RepositoryName', {
        value: MiraConfig.calculateRepositoryName()
      })

      technicalUser.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [repository.repositoryArn],
        actions: ['*']
      }))

      const uploadedSsh = new UploadPublicSsh(this, 'technical-user-ssh', {
        userName: technicalUser.userName,
        publicKey: codeCommitUserPublicKey
      })

      new CfnOutput(this, 'GitUserName', {
        value: uploadedSsh.sshPublicKeyId
      })

      action = new CodeCommitSourceAction({
        actionName: 'Source',
        branch: branchName,
        repository,
        output: sourceOutput
      })
    } else if (gitHubTokenSecretArn) {
      const oAuthToken = Secret.fromSecretArn(this, 'GitHubToken', gitHubTokenSecretArn)
      action = new GitHubSourceAction({
        actionName: 'Source',
        branch: branchName,
        oauthToken: oAuthToken.secretValue,
        output: sourceOutput,
        owner: repositoryOwner,
        repo: repositoryName
      })
    } else {
      const msg = 'at least one of gitHubTokenSecretArn or codeCommitUserPublicKey not provided.'
      console.error(msg)
      throw new Error(msg)
    }
    return action
  }

  private addDeployStage (name: string, input: Artifact): void {
    const conf = MiraConfig.getEnvironment(name)
    const {
      env: {
        account,
        region
      }
    } = conf
    const prefix = `${getBaseStackName()}-${pascalCase(name)}`

    const deployProjectRoleName = `${prefix}-CodebuildRole`
    const role = new Role(this, deployProjectRoleName, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    role.addToPolicy(new PolicyStatement({
      actions: [
        'sts:AssumeRole',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'kms:decrypt'
      ],
      resources: ['*']
    }))
    const { buildspecFile } = MiraConfig.getCICDConfig()
    const projectEnvVariables: CommonProjectProps['environmentVariables'] = {
      ROLE_NAME: { type: BuildEnvironmentVariableType.PLAINTEXT, value: getDeployProjectRoleName(name) },
      ROLE_ARN: { type: BuildEnvironmentVariableType.PLAINTEXT, value: this.getDeployRoleArn(name, account) },
      ACCOUNT_NUMBER: { type: BuildEnvironmentVariableType.PLAINTEXT, value: account },
      REGION: { type: BuildEnvironmentVariableType.PLAINTEXT, value: region },
      ENVIRONMENT: { type: BuildEnvironmentVariableType.PLAINTEXT, value: pascalCase(name) }
    }
    this.pipelineEnvironment.forEach((keyValue) => {
      projectEnvVariables[keyValue.key] = {
        type: BuildEnvironmentVariableType.PLAINTEXT,
        value: keyValue.value

      }
    })
    const project = new PipelineProject(this, `${getBaseStackName()}-${name}Deploy`, {
      buildSpec: BuildSpec.fromSourceFilename(buildspecFile),
      encryptionKey: this.pipeline.artifactBucket.encryptionKey,
      environmentVariables: projectEnvVariables,
      role
    })

    if (conf.requireManualApproval) {
      this.pipeline.addStage({
        actions: [
          new ManualApprovalAction({ actionName: 'Promote' })
        ],
        stageName: 'Promote'
      })
    }

    this.pipeline.addStage({
      actions: [
        new CodeBuildAction({
          actionName: `${getBaseStackName()}-${name}Deploy`,
          input,
          project
        })
      ],
      stageName: `${getBaseStackName()}-${name}Deploy`
    })
  }

  private getDeployRoleArn (environment: string, account: string): string {
    return `arn:aws:iam::${account}:role/${getDeployProjectRoleName(environment)}`
  }
}
