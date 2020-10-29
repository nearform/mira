import { CfnOutput, Stack, App } from '@aws-cdk/core'
import {
  AccountPrincipal,
  CompositePrincipal,
  Role,
  PolicyStatement,
  ManagedPolicy,
  ServicePrincipal
} from '@aws-cdk/aws-iam'
import { Topic } from '@aws-cdk/aws-sns'
import { AssetCode, SingletonFunction } from '@aws-cdk/aws-lambda'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'

import { DomainConfig, MiraConfig, Account } from '../../../../config/mira-config'
import { Route53Manager } from '.'
import { MiraApp } from '../../../app'

jest.mock('@aws-cdk/core', () => ({
  ...jest.requireActual('@aws-cdk/core'),
  CfnOutput: jest.fn()
}))

jest.mock('@aws-cdk/aws-iam', () => ({
  ...jest.requireActual('@aws-cdk/aws-iam'),
  AccountPrincipal: jest.fn(),
  Role: jest.fn().mockImplementation(() => ({
    addToPolicy: jest.fn(),
    addManagedPolicy: jest.fn()
  })),
  PolicyStatement: jest.fn(),
  ManagedPolicy: {
    fromManagedPolicyName: jest.fn(),
    fromAwsManagedPolicyName: jest.fn()
  },
  ServicePrincipal: jest.fn(),
  CompositePrincipal: jest.fn()
}))

jest.mock('@aws-cdk/aws-sns', () => ({
  ...jest.requireActual('@aws-cdk/aws-sns'),
  Topic: jest.fn().mockImplementation(() => ({
    addToResourcePolicy: jest.fn()
  }))
}))

jest.mock('@aws-cdk/aws-lambda-event-sources', () => ({
  ...jest.requireActual('@aws-cdk/aws-lambda-event-sources'),
  SnsEventSource: jest.fn()
}))

jest.mock('@aws-cdk/aws-lambda', () => ({
  ...jest.requireActual('@aws-cdk/aws-lambda'),
  AssetCode: jest.fn(),
  SingletonFunction: jest.fn().mockImplementation(() => ({
    addEventSource: jest.fn()
  }))
}))

describe('Route53Manager', () => {
  beforeEach(() => {
    new MiraApp()
    MiraApp.instance.initializeApp()
  })
  it('Throw if hostedZoneId is not in domain config', async () => {
    const stack = new Stack(
      MiraApp.instance.cdkApp,
      MiraConfig.getBaseStackName('CertificateManager'),
      {}
    )

    MiraConfig.getEnvironment = (): Account => ({
      name: 'some-name',
      profile: 'some-profile',
      env: { account: '12345', region: 'eu-west-1' }
    })
    MiraConfig.getDomainConfig = (): DomainConfig => ({
      accounts: []
    })

    expect(() => new Route53Manager()).toThrowError(
      'Cannot find hostedZoneId in config.'
    )
  })

  it('call all functions correctly', async () => {
    const stack = new Stack(
      MiraApp.instance.cdkApp,
      MiraConfig.getBaseStackName('CertificateManager'),
      {}
    )

    MiraConfig.getEnvironment = (): Account => ({
      name: 'some-name',
      profile: 'some-profile',
      env: { account: '12345', region: 'eu-west-1' }
    })
    MiraConfig.getDomainConfig = (): DomainConfig => ({
      hostedZoneId: '123456',
      accounts: []
    })

    MiraConfig.getDomainAllowedPrincipals = (): Account[] => ([{
      name: 'some-name',
      profile: 'some-profile',
      env: { account: '12345', region: 'eu-west-1' }
    }])

    MiraConfig.calculateSharedResourceName = (resource: string): string => `prefix-${resource}`

    expect(() => new Route53Manager()).not.toThrowError()

    expect(AccountPrincipal).toBeCalledTimes(2)
    expect(Topic).toBeCalledTimes(1)
    expect(PolicyStatement).toBeCalledTimes(6)
    expect(AssetCode).toBeCalledTimes(1)
    expect(ManagedPolicy.fromManagedPolicyName).toBeCalledTimes(1)
    expect(Role).toBeCalledTimes(2)
    expect(ServicePrincipal).toBeCalledTimes(1)
    expect(ManagedPolicy.fromAwsManagedPolicyName).toBeCalledTimes(1)
    expect(SingletonFunction).toBeCalledTimes(1)
    expect(SnsEventSource).toBeCalledTimes(1)
    expect(CfnOutput).toBeCalledTimes(2)
    expect(CompositePrincipal).toBeCalledTimes(1)
  })
})
