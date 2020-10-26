import { Construct } from '@aws-cdk/core'
import {
  Effect,
  ManagedPolicy,
  PolicyStatement
} from '@aws-cdk/aws-iam'
import { MiraConfig } from '../../../../config/mira-config'
import { MiraStack } from '../../../stack'

export const ROUTE53_MANAGER_POLICY_BOUNDARY = 'Route53ManagerPolicyBoundary'

export class Route53ManagerAccessRole extends MiraStack {
  constructor (parent: Construct) {
    super(parent, Route53ManagerAccessRole.name)
    const { hostedZoneId } = MiraConfig.getDomainConfig()
    if (!hostedZoneId) {
      throw new Error('"hostedZoneId" is required in "domain" config')
    }
    new ManagedPolicy(this, 'permissionBoundaryPolicy',
      {
        managedPolicyName: MiraConfig.getBaseStackName('Route53ManagerPolicyBoundary'),
        description: 'Boundary that defines what action can be performed by the Route53Manager stack resources',
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: [
              'route53:GetChange'
            ]
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents'
            ]
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            resources: [`arn:aws:route53:::hostedzone/${hostedZoneId}`],
            actions: [
              'route53:ChangeResourceRecordSets',
              'route53:ListResourceRecordSets'
            ]
          })
        ]
      })
  }
}
