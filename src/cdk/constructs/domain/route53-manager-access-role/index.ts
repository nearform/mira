import { Construct } from '@aws-cdk/core'
import {
  Effect,
  ManagedPolicy,
  PolicyStatement
} from '@aws-cdk/aws-iam'
import { MiraConfig } from '../../../../config/mira-config'
import { MiraStack } from '../../../stack'

export class Route53ManagerAccessRoleStack extends MiraStack {
  constructor (parent: Construct) {
    super(parent, Route53ManagerAccessRoleStack.name)
    const { hostedZoneId } = MiraConfig.getDomainConfig()
    if (!hostedZoneId) {
      throw new Error('Cannot find hostedZoneId in config.')
    }
    new ManagedPolicy(this, 'permissionBoundaryPolicy',
      {
        managedPolicyName: MiraConfig.calculateSharedResourceName('Route53ManagerPolicyBoundary'),
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
