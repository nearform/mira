import { Code, Runtime, SingletonFunction } from '@aws-cdk/aws-lambda'
import { Construct, Duration, Resource } from '@aws-cdk/core'
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation'
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import * as path from 'path'

export interface UploadPublicSshProps {
  userName: string
  publicKey: string
}

export class UploadPublicSsh extends Resource {
  sshPublicKeyId: string

  constructor (scope: Construct, id: string, props: UploadPublicSshProps) {
    super(scope, id)

    const role = new Role(this, 'managePublicSshKeys', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })
    role.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:iam::*:user/${props.userName}`],
      actions: [
        'iam:uploadSSHPublicKey',
        'iam:updateSSHPublicKey',
        'iam:getSSHPublicKey',
        'iam:deleteSSHPublicKey',
        'iam:listSSHPublicKeys'
      ]
    }))

    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

    const lambda = new SingletonFunction(this, 'UploadPublicSshHandler', {
      uuid: 'f7c82053-f5e1-47f7-87de-2b304c759d19',
      runtime: Runtime.NODEJS_12_X,
      code: Code.fromAsset(path.join(__dirname, '../../custom-resources')),
      handler: 'upload-public-ssh/lambda/index.handler',
      lambdaPurpose: 'UploadPublicSsh',
      timeout: Duration.minutes(15),
      role
    })

    const provider = CustomResourceProvider.fromLambda(lambda)

    const ssh = new CustomResource(this, 'UploadPublicSsh', {
      provider,
      resourceType: 'Custom::UploadPublicSsh',
      properties: {
        SSHPublicKeyBody: props.publicKey,
        UserName: props.userName
      }
    })
    this.sshPublicKeyId = ssh.getAttString('SSHPublicKeyId')
  }
}
