import { CfnOutput, Construct, Duration } from '@aws-cdk/core'
import { Topic } from '@aws-cdk/aws-sns'
import { SingletonFunction, Runtime, AssetCode } from '@aws-cdk/aws-lambda'
import { FollowMode } from '@aws-cdk/assets'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { AccountPrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { MiraStack } from '../../../stack'
import { MiraConfig } from '../../../../config/mira-config'
// interface CertificateManagerProps {
//   readonly environment: string
// }

import path from 'path'

export class CertificateManager extends MiraStack {
  // constructor (parent: Construct, props: CertificateManagerProps) {
  constructor (parent: Construct) {
    const id = MiraConfig.getBaseStackName('CertificateManager')
    super(parent, id)

    const account = MiraConfig.getEnvironment()
    const { hostedZoneId } = MiraConfig.getDomainConfig()
    if (!hostedZoneId) {
      throw new Error('Cannot find hostedZoneId in config.')
    }

    const allowedPrincipals = MiraConfig.getDomainAllowedPrincipals().map(account => new AccountPrincipal(account.env.account))

    const code = new AssetCode(path.join(__dirname, '..', '..', '..', '..', 'lambdas'), {
      follow: FollowMode.ALWAYS
    })

    const DomainManagerRole = new Role(this, 'Route53ManagerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })
    DomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
      actions: ['route53:ChangeResourceRecordSets']
    }))
    DomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['acm:RequestCertificate', 'acm:DescribeCertificate', 'acm:DeleteCertificate', 'acm:ListCertificates']
    }))
    DomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['route53:GetChange']
    }))
    DomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:iam::${account.env.account}:role/${MiraConfig.getBaseStackName('DomainManager-Role')}`], // arn:aws:iam::714436996402:role/Piotrzimoch-Mira-DomainManager-Role
      actions: ['sts:AssumeRole']
    }))

    DomainManagerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

    const certificateSubscriptionTopic = new Topic(this, 'CertificateSubscriptionTopic', {
      displayName: 'Certificate Subscription Topic',
      topicName: MiraConfig.getBaseStackName('CertificateSubscriptionTopic')
    })

    certificateSubscriptionTopic.addToResourcePolicy(new PolicyStatement({
      principals: allowedPrincipals,
      effect: Effect.ALLOW,
      resources: [certificateSubscriptionTopic.topicArn],
      actions: ['sns:Publish']
    }))

    const CertificateManagerLambda = new SingletonFunction(this, 'CertificateManagerLambda', {
      code,
      handler: 'certificate-manager.handler',
      runtime: Runtime.NODEJS_10_X,
      timeout: Duration.minutes(15),
      uuid: 'dfb3da1c-591a-4225-a327-d56a74823a5e',
      environment: {
        HOSTED_ZONE: hostedZoneId
      },
      role: DomainManagerRole
    })

    CertificateManagerLambda.addEventSource(new SnsEventSource(certificateSubscriptionTopic))

    new CfnOutput(this, 'certificateSubscriptionTopicArn', {
      value: certificateSubscriptionTopic.topicArn
    })
  }
}
