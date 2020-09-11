import { Construct, Stack } from '@aws-cdk/core'
import { Role, AccountPrincipal, PolicyStatement } from '@aws-cdk/aws-iam'
import { MiraApp } from '../../../app'
import { MiraConfig } from '../../../../config/mira-config'
import { getBaseStackName, getDeployProjectRoleName } from '../../config/utils'

export interface DeploymentPermissionsProps {
  env: string
}

export class DeploymentPermissions extends Stack {
  public role: Role

  constructor (parent: Construct, props: DeploymentPermissionsProps) {
    const name = getBaseStackName('CICDPermissions')
    const account = MiraConfig.getEnvironment(props.env)
    super(parent, name, { env: account.env })
    const baseProject = MiraApp.getBaseStackName()
    this.role = new Role(this, `DeployProjectRole-${account.name}`, {
      assumedBy: new AccountPrincipal(MiraConfig.getCICDConfig().account.env.account),
      roleName: getDeployProjectRoleName(account.name)
    })
    // Policy statements needed for CDK to deploy any template.
    this.role.addToPolicy(new PolicyStatement({
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
    }))

    this.role.addToPolicy(new PolicyStatement({
      actions: [
        'sts:AssumeRole'
      ],
      resources: ['*']
    }))
    // Actions to start the build/deploy
    this.role.addToPolicy(new PolicyStatement({
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
    }))

    this.role.addToPolicy(new PolicyStatement({
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
    }))
  }
}
