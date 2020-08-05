import { Route53Manager } from '.'
import { CfnOutput, Stack, App } from '@aws-cdk/core'
import { MiraConfig } from '../../../../config/mira-config'
import { AccountPrincipal, CompositePrincipal, Role, PolicyStatement, ManagedPolicy, ServicePrincipal } from '@aws-cdk/aws-iam'
import { Topic } from '@aws-cdk/aws-sns'
import { AssetCode, SingletonFunction } from '@aws-cdk/aws-lambda'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'

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
  it('Throw if hostedZoneId is not in domain config', async () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName('CertificateManager'),
      {}
    )

    MiraConfig.getEnvironment = (): any => ({})
    MiraConfig.getDomainConfig = (): any => ({})

    expect(() => new Route53Manager(stack)).toThrowError(
      'Cannot find hostedZoneId in config.'
    )
  })

  it('call all functions correctly', async () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName('CertificateManager'),
      {}
    )

    MiraConfig.getEnvironment = (): any => ({})
    MiraConfig.getDomainConfig = (): any => ({
      hostedZoneId: 1,
      profile: 'mira-dev',
      name: 'default',
      target: 'default',
      dev: {
        target: 'default'
      }
    })

    MiraConfig.getDomainAllowedPrincipals = (): any => ([{ env: { account: {} } }])

    MiraConfig.calculateSharedResourceName = (): any => ({})

    expect(() => new Route53Manager(stack)).not.toThrowError()

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
