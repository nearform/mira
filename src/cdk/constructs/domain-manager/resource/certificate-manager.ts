import { AccountPrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { Code, Runtime, SingletonFunction } from '@aws-cdk/aws-lambda'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Topic } from '@aws-cdk/aws-sns'
import { CfnOutput, Construct, Duration } from '@aws-cdk/core'
import path from 'path'
import { MiraConfig } from '../../../../config/mira-config'
import { MiraStack } from '../../../stack'

export const CERTIFICATE_SUBSCRIPTION_TOPIC = 'CertificateSubscriptionTopic'

/**
 * Certificate manager
 */
export class CertificateManager extends MiraStack {
  constructor (parent: Construct) {
    super(parent, 'CertificateManager')
    const account = MiraConfig.getEnvironment()
    const domainAccount = MiraConfig.getEnvironment('domain')
    const { hostedZoneId } = MiraConfig.getDomainConfig()

    if (!hostedZoneId) {
      throw new Error('"hostedZoneId" is required in "domain" config')
    }

    // Create role for CertificateManager and add policies
    const certificateManagerRole = new Role(this, 'CertificateManagerLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })

    certificateManagerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

    certificateManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['acm:RequestCertificate', 'acm:DescribeCertificate', 'acm:DeleteCertificate', 'acm:ListCertificates']
    }))

    certificateManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:iam::${domainAccount.env.account}:role/${MiraConfig.getBaseStackName('CrossAccountDomainManagerRole')}`],
      actions: ['sts:AssumeRole']
    }))

    // Create SNS topic
    const certificateSubscriptionTopic = new Topic(this, CERTIFICATE_SUBSCRIPTION_TOPIC, {
      displayName: 'Certificate Subscription Topic',
      topicName: MiraConfig.calculateSharedResourceName(CERTIFICATE_SUBSCRIPTION_TOPIC)
    })

    // Allow account to publish message to topic
    certificateSubscriptionTopic.addToResourcePolicy(new PolicyStatement({
      principals: [new AccountPrincipal(account.env.account)],
      effect: Effect.ALLOW,
      resources: [certificateSubscriptionTopic.topicArn],
      actions: ['sns:Publish']
    }))

    // Lambda handler - TODO update code
    const certificateManagerLambda = new SingletonFunction(this, 'CertificateManagerLambda', {
      code: Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'certificate-manager.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(15),
      uuid: '59d1148b-c159-4a58-883e-fd31df31a2d9',
      environment: {
        HOSTED_ZONE: hostedZoneId
      },
      role: certificateManagerRole
    })

    certificateManagerLambda.addEventSource(new SnsEventSource(certificateSubscriptionTopic))

    new CfnOutput(this, 'certificateSubscriptionTopicArn', {
      value: certificateSubscriptionTopic.topicArn
    })
  }
}
