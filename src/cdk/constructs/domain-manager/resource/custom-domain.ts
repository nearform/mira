import { Topic } from '@aws-cdk/aws-sns'
import { Construct } from '@aws-cdk/core'
import {
  CustomResource,
  CustomResourceProvider
} from '@aws-cdk/aws-cloudformation'
import { MiraConfig } from '../../../..'
import { DOMAIN_SUBSCRIPTION_TOPIC } from './route53-manager'

export interface CustomDomainProps {
  source: string
  target: string
}

export class CustomDomain extends Construct {
  domain: CustomResource

  constructor (parent: Construct, props: CustomDomainProps) {
    super(parent, 'CustomDomainResouce')

    const topicName = MiraConfig.getBaseStackName(DOMAIN_SUBSCRIPTION_TOPIC)
    const domainAccountConfig = MiraConfig.getEnvironment('domain')

    const domainProviderTopic = Topic.fromTopicArn(
      this,
      'DomainProvider',
      `arn:aws:sns:${domainAccountConfig.env.region}:${domainAccountConfig.env.account}:${topicName}`
    )

    this.domain = new CustomResource(this, 'CustomDomain', {
      provider: CustomResourceProvider.fromTopic(domainProviderTopic),
      properties: {
        Source: props.source,
        Target: props.target
      },
      resourceType: 'Custom::Domain'
    })
  }
}
