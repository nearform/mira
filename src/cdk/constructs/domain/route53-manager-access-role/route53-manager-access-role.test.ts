import { Route53ManagerAccessRoleStack } from '.'
import * as cdk from '@aws-cdk/core'
import { MiraConfig } from '../../../../config/mira-config'

import {
  ManagedPolicy
} from '@aws-cdk/aws-iam'

describe('Route53ManagerAccessRoleStack', () => {
  it('Throw if hostedZoneId is not in domain config', async () => {
    const stack = new cdk.Stack(
      new cdk.App(),
      MiraConfig.getBaseStackName('DomainManager'),
      {}
    )
    MiraConfig.getDomainConfig = (): any => ({})

    expect(() => new Route53ManagerAccessRoleStack(stack)).toThrowError(
      'Cannot find hostedZoneId in config.'
    )
  })

  it('Can create a ManagedPolicy with id permissionBoundaryPolicy', async () => {
    const stack = new cdk.Stack(
      new cdk.App(),
      MiraConfig.getBaseStackName('DomainManager'),
      {}
    )

    MiraConfig.getDomainConfig = (): any => ({
      hostedZoneId: 1,
      profile: 'mira-dev',
      name: 'default',
      target: 'default',
      dev: {
        target: 'default'
      }
    })

    MiraConfig.calculateSharedResourceName = (): string => 'value'

    const res = await new Route53ManagerAccessRoleStack(stack)

    try {
      new ManagedPolicy(res, 'permissionBoundaryPolicy')
    } catch (err) {
      expect(err.message).toBe("There is already a Construct with name 'permissionBoundaryPolicy' in Route53ManagerAccessRoleStack [Route53ManagerAccessRoleStack-1]")
    }
  })
})
