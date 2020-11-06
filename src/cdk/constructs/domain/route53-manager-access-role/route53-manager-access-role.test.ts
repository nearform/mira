import * as cdk from '@aws-cdk/core'

import {
  ManagedPolicy
} from '@aws-cdk/aws-iam'

import { MiraConfig, DomainConfig } from '../../../../config/mira-config'
import { MiraApp } from '../../../app'
import { Route53ManagerAccessRoleStack } from '.'

describe('Route53ManagerAccessRoleStack', () => {
  beforeEach(() => {
    new MiraApp()
    MiraApp.instance.initializeApp()
  })
  it('Throw if hostedZoneId is not in domain config', async () => {
    const stack = new cdk.Stack(
      new cdk.App(),
      MiraConfig.getBaseStackName('DomainManager'),
      {}
    )
    MiraConfig.getDomainConfig = (): DomainConfig => ({
      accounts: []
    })

    expect(() => new Route53ManagerAccessRoleStack()).toThrowError(
      'Cannot find hostedZoneId in config.'
    )
  })

  it('Can create a ManagedPolicy with id permissionBoundaryPolicy', async () => {
    const stack = new cdk.Stack(
      new cdk.App(),
      MiraConfig.getBaseStackName('DomainManager'),
      {}
    )

    MiraConfig.getDomainConfig = (): DomainConfig => ({
      hostedZoneId: '123456',
      accounts: []
    })

    MiraConfig.calculateSharedResourceName = (): string => 'prefix'

    const stackObj = new Route53ManagerAccessRoleStack()
    const res = await stackObj.initialized

    try {
      new ManagedPolicy(stackObj.stack, 'permissionBoundaryPolicy')
    } catch (err) {
      expect(err.message).toBe("There is already a Construct with name 'permissionBoundaryPolicy' in Stack [prefix-Route53ManagerAccessRoleStack]")
    }
  })
})
