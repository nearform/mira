import { CertificateManager } from '.'
import { CfnOutput, Stack, App } from '@aws-cdk/core'
import { Topic } from '@aws-cdk/aws-sns'
import { MiraConfig } from '../../../../config/mira-config'
import { AccountPrincipal, Role, PolicyStatement, ManagedPolicy } from '@aws-cdk/aws-iam'
import { AssetCode, SingletonFunction } from '@aws-cdk/aws-lambda'
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources'

jest.mock('@aws-cdk/aws-iam', () => ({
  ...jest.requireActual('@aws-cdk/aws-iam'),
  AccountPrincipal: jest.fn(),
  Role: jest.fn().mockImplementation(() => ({
    addToPolicy: jest.fn(),
    addManagedPolicy: jest.fn()
  })),
  PolicyStatement: jest.fn(),
  ManagedPolicy: {
    fromAwsManagedPolicyName: jest.fn()
  }
}))

jest.mock('@aws-cdk/aws-lambda-event-sources', () => ({
  ...jest.requireActual('@aws-cdk/aws-lambda-event-sources'),
  SnsEventSource: jest.fn()
}))

jest.mock('@aws-cdk/core', () => ({
  ...jest.requireActual('@aws-cdk/core'),
  CfnOutput: jest.fn()
}))

jest.mock('@aws-cdk/aws-lambda', () => ({
  ...jest.requireActual('@aws-cdk/aws-lambda'),
  AssetCode: jest.fn(),
  SingletonFunction: jest.fn().mockImplementation(() => ({
    addEventSource: jest.fn()
  }))
}))

jest.mock('@aws-cdk/aws-sns', () => ({
  ...jest.requireActual('@aws-cdk/aws-sns'),
  Topic: jest.fn().mockImplementation(() => ({
    addToResourcePolicy: jest.fn()
  }))
}))

describe('CertificateManager', () => {
  it('Throw if hostedZoneId is not in domain config', async () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName('CertificateManager'),
      {}
    )

    MiraConfig.getDomainConfig = (): any => ({})

    MiraConfig.getEnvironment = (): any => ({})

    expect(() => new CertificateManager(stack)).toThrowError(
      'Cannot find hostedZoneId in config.'
    )
  })

  it('call all functions correctly', async () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName('CertificateManager'),
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

    MiraConfig.getEnvironment = (): any => ({
      env: {
        account: 'test-account'
      }
    })

    MiraConfig.getDomainAllowedPrincipals = (): any => ([{ env: { account: {} } }])

    expect(() => new CertificateManager(stack)).not.toThrowError()

    expect(AccountPrincipal).toBeCalledTimes(1)
    expect(AssetCode).toBeCalledTimes(1)
    expect(Role).toBeCalledTimes(1)
    expect(PolicyStatement).toBeCalledTimes(5)
    expect(ManagedPolicy.fromAwsManagedPolicyName).toBeCalledTimes(1)
    expect(Topic).toBeCalledTimes(1)
    expect(SingletonFunction).toBeCalledTimes(1)
    expect(SnsEventSource).toBeCalledTimes(1)
    expect(CfnOutput).toBeCalledTimes(1)
  })
})
