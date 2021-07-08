import { CfnOutput, Construct, Duration } from '@aws-cdk/core'
import { Topic } from '@aws-cdk/aws-sns'
import { SingletonFunction, Runtime, AssetCode } from '@aws-cdk/aws-lambda'
import { FollowMode } from '@aws-cdk/assets'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'
import { AccountPrincipal, CompositePrincipal, Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { MiraConfig } from '../../../../config/mira-config'
import path from 'path'
import { MiraStack } from '../../../stack'
export class Route53Manager extends MiraStack {
  constructor (parent: Construct) {
    const id = MiraConfig.getBaseStackName('Route53Manager')
    super(parent, id)
    const account = MiraConfig.getEnvironment()
    const { hostedZoneId } = MiraConfig.getDomainConfig()
    if (!hostedZoneId) {
      throw new Error('Cannot find hostedZoneId in config.')
    }

    const allowedPrincipals = MiraConfig.getDomainAllowedPrincipals().map(account => new AccountPrincipal(account.env.account))

    const domainSubscriptionTopic = new Topic(this, 'DomainSubscriptionTopic', {
      displayName: 'Domain Subscription Topic',
      topicName: MiraConfig.getBaseStackName(`${account.name}-DomainSubscriptionTopic`)
    })

    domainSubscriptionTopic.addToResourcePolicy(new PolicyStatement({
      principals: allowedPrincipals,
      effect: Effect.ALLOW,
      resources: [domainSubscriptionTopic.topicArn],
      actions: ['sns:Publish']
    }))

    const code = new AssetCode(path.join(__dirname, '..', '..', '..', '..', 'lambdas'), {
      follow: FollowMode.ALWAYS
    })

    const permissionsBoundary = ManagedPolicy.fromManagedPolicyName(this, 'Route53PermissionsBoundary', MiraConfig.calculateSharedResourceName('Route53ManagerPolicyBoundary'))

    const DomainManagerRole = new Role(this, 'Route53ManagerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      permissionsBoundary
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
      actions: ['route53:GetChange', 'route53:ListResourceRecordSets']
    }))

    DomainManagerRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'))

    const Route53ManagerLambda = new SingletonFunction(this, 'Route53ManagerLambda', {
      code,
      handler: 'route53-manager.handler',
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(5),
      uuid: '934dd096-1586-46c4-92a0-0dd1239e993f',
      environment: {
        HOSTED_ZONE: hostedZoneId
      },
      role: DomainManagerRole
    })

    Route53ManagerLambda.addEventSource(new SnsEventSource(domainSubscriptionTopic))

    new CfnOutput(this, 'domainSubscriptionTopicArn', {
      value: domainSubscriptionTopic.topicArn
    })
    const allowedCompositePrincipals = new CompositePrincipal(
      ...MiraConfig
        .getDomainAllowedPrincipals()
        .map(account => new AccountPrincipal(account.env.account))
    )
    const CrossAccountDomainManagerRole = new Role(this, 'CrossAccountDomainManagerRole', {
      assumedBy: allowedCompositePrincipals,
      roleName: MiraConfig.getBaseStackName('DomainManager-Role'),
      permissionsBoundary
    })
    CrossAccountDomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
      actions: ['route53:ChangeResourceRecordSets']
    }))
    CrossAccountDomainManagerRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: ['route53:GetChange']
    }))
    new CfnOutput(this, 'CrossAccountDomainManagerRoleArn', {
      value: CrossAccountDomainManagerRole.roleArn
    })
  }
}
