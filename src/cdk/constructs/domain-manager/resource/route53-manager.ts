import { AccountPrincipal, CompositePrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { Code, Runtime, SingletonFunction } from '@aws-cdk/aws-lambda'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { Topic } from '@aws-cdk/aws-sns'
import { CfnOutput, Construct, Duration } from '@aws-cdk/core'
import path from 'path'
import { MiraConfig } from '../../../..'
import { MiraStack } from '../../../stack'
import { ROUTE53_MANAGER_POLICY_BOUNDARY } from './route53-manager-access-role'

export const DOMAIN_SUBSCRIPTION_TOPIC = 'DomainSubscriptionTopic'
export const CROSS_ACCOUNT_DOMAIN_MANAGER_ROLE = 'CrossAccountDomainManagerRole'

export class Route53Manager extends MiraStack {
  constructor (parent: Construct) {
    super(parent, 'Route53Manager')

    const { hostedZoneId } = MiraConfig.getDomainConfig()

    if (!hostedZoneId) {
      throw new Error('"hostedZoneId" is required in "domain" config')
    }

    const allowedPrincipals = MiraConfig.getDomainAllowedPrincipals().map(account => new AccountPrincipal(account.env.account))

    // Create role & permissions
    const permissionsBoundary = ManagedPolicy.fromManagedPolicyName(
      this,
      'Route53ManagerPermissionsBoundary',
      MiraConfig.calculateSharedResourceName(ROUTE53_MANAGER_POLICY_BOUNDARY)
    )

    const route53ManagerRole = new Role(this, 'Route53ManagerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      permissionsBoundary
    })

    route53ManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
      actions: ['route53:ChangeResourceRecordSets']
    }))

    route53ManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['route53:GetChange', 'route53:ListResourceRecordSets']
    }))

    route53ManagerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

    // Create topic
    const domainSubscriptionTopic = new Topic(this, DOMAIN_SUBSCRIPTION_TOPIC, {
      displayName: 'Domain Subscription Topic',
      topicName: MiraConfig.getBaseStackName(DOMAIN_SUBSCRIPTION_TOPIC)
    })

    domainSubscriptionTopic.addToResourcePolicy(new PolicyStatement({
      principals: allowedPrincipals,
      effect: Effect.ALLOW,
      resources: [domainSubscriptionTopic.topicArn],
      actions: ['sns:Publish']
    }))

    // Create lambda handler
    const route53ManagerLambda = new SingletonFunction(this, 'Route53ManagerLambda', {
      code: Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'route53-manager.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(5),
      uuid: 'ec40983d-c7fe-40fd-a99d-47e61eb307f8',
      environment: {
        HOSTED_ZONE: hostedZoneId
      },
      role: route53ManagerRole
    })

    route53ManagerLambda.addEventSource(new SnsEventSource(domainSubscriptionTopic))

    new CfnOutput(this, 'domainSubscriptionTopicArn', {
      value: domainSubscriptionTopic.topicArn
    })

    // Set up CrossAccountDomainManagerRole
    // this role will be assumed by certificate manager
    const allowedCompositePrincipals = new CompositePrincipal(
      ...MiraConfig
        .getDomainAllowedPrincipals()
        .map(account => new AccountPrincipal(account.env.account))
    )
    const crossAccountDomainManagerRole = new Role(this, CROSS_ACCOUNT_DOMAIN_MANAGER_ROLE, {
      assumedBy: allowedCompositePrincipals,
      roleName: MiraConfig.calculateSharedResourceName(CROSS_ACCOUNT_DOMAIN_MANAGER_ROLE),
      permissionsBoundary
    })
    crossAccountDomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
      actions: ['route53:ChangeResourceRecordSets']
    }))
    crossAccountDomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['route53:GetChange']
    }))
    new CfnOutput(this, 'crossAccountDomainManagerRoleArn', {
      value: crossAccountDomainManagerRole.roleArn
    })
  }
}
