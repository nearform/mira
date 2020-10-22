import { Topic } from '@aws-cdk/aws-sns'
import { Construct } from '@aws-cdk/core'
import {
  CustomResource,
  CustomResourceProvider
} from '@aws-cdk/aws-cloudformation'
import { MiraConfig } from '../../../..'
import { CERTIFICATE_SUBSCRIPTION_TOPIC } from './certificate-manager'
import { CROSS_ACCOUNT_DOMAIN_MANAGER_ROLE } from './route53-manager'

export interface CustomCertificateProps {
  domain: string
}

export class CustomCertificate extends Construct {
  certificate: CustomResource
  certificateArn: string

  constructor (parent: Construct, props: CustomCertificateProps) {
    super(parent, 'CustomCertificateResouce')

    const topicName = MiraConfig.getBaseStackName(CERTIFICATE_SUBSCRIPTION_TOPIC)
    const accountConfig = MiraConfig.getEnvironment()
    const domainAccountConfig = MiraConfig.getEnvironment('domain')

    const CertificateProviderTopic = Topic.fromTopicArn(
      this,
      'CertificateProvider',
      `arn:aws:sns:${accountConfig.env.region}:${accountConfig.env.account}:${topicName}`
    )

    this.certificate = new CustomResource(this, 'CustomCertificate', {
      provider: CustomResourceProvider.fromTopic(
        CertificateProviderTopic
      ),
      properties: {
        Domain: props.domain,
        Route53Role: `arn:aws:iam::${domainAccountConfig.env.account}:role/${MiraConfig.getBaseStackName(CROSS_ACCOUNT_DOMAIN_MANAGER_ROLE)}`
      },
      resourceType: 'Custom::Certificate'
    })

    this.certificateArn = this.certificate.getAttString('arn')
  }
}
