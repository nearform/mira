import { MiraApp } from './app'
import config from 'config'
import _ from 'lodash'
import mockConfig from './../config/__mocks__/default.json'
import mockConfigBroken from './../config/__mocks__/default.broken.json'
import yargs from 'yargs'
import { MiraConfig } from '../config/mira-config'
const assumeRoleMock = jest.fn()

jest.mock('../assume-role', () => ({
  assumeRole: assumeRoleMock
}))
const MiraBootstrap = require('./bootstrap').MiraBootstrap

jest.mock('config')

MiraConfig.getEnvironment = jest.fn()

const mockConfigHandler = (mockConfig: any): void => {
  config.get = (key: string): any => _.get(mockConfig, key)
  config.has = (key: string): any => _.has(mockConfig, key)
  config.util.toObject = () => mockConfig
}

describe('MiraBootstrap', () => {
  const miraBootstrapInstance = new MiraBootstrap()
  it('has resolved cdkCommand path', () => {
    const validCdkPathPart = 'node_modules/aws-cdk/bin/cdk'
    expect(new RegExp(validCdkPathPart, 'g').test(miraBootstrapInstance.cdkCommand)).toBeTruthy()
  })
  it('has resolved docsify path', () => {
    const validCdkPathPart = 'node_modules/docsify-cli/bin/docsify'
    expect(new RegExp(validCdkPathPart, 'g').test(miraBootstrapInstance.docsifyCommand)).toBeTruthy()
  })
  it('has app initialized', () => {
    expect(miraBootstrapInstance.app instanceof MiraApp).toBeTruthy()
  })
})

describe('MiraBootstrap deploy', () => {
  const miraBootstrapInstance = new MiraBootstrap()
  miraBootstrapInstance.spawn = () => {
    return {
      on: (code: string, fn: Function) => {
        fn(0)
      }
    }
  }
  it('do not calls assume role when no role provided in the cli', async () => {
    mockConfigHandler(mockConfig)
    miraBootstrapInstance.args = yargs(['']).argv

    await miraBootstrapInstance.deploy()
    expect(assumeRoleMock).toBeCalledTimes(0)
  })
  it('throw error on json validation', async () => {
    mockConfigHandler(mockConfigBroken)
    miraBootstrapInstance.args = yargs(['cicd', '--file=/index.ts']).argv
    await expect(miraBootstrapInstance.initialize()).rejects.toThrow()
  })
  it('calls assume role when role provided in the cli', async () => {
    mockConfigHandler(mockConfig)
    miraBootstrapInstance.args = yargs(['--role', 'arn:aws:iam::111111111111:role/CompanyDev-AdminAccess']).argv

    await miraBootstrapInstance.deploy()
    expect(assumeRoleMock).toBeCalled()
  })
  it('spawns new process with the right parameters', async () => {
    mockConfigHandler(mockConfig)
    miraBootstrapInstance.args = yargs().argv
    miraBootstrapInstance.spawn = jest.fn().mockReturnValue({
      on: (code: string, fn: Function) => {
        fn(0)
      }
    })
    await miraBootstrapInstance.deploy()
    expect(miraBootstrapInstance.spawn.mock.calls[0][0]).toBe('node')
    const cdkExecutablePath = miraBootstrapInstance.spawn.mock.calls[0][1][0]
    expect(RegExp('aws-cdk', 'g').test(cdkExecutablePath)).toBeTruthy()
    expect(miraBootstrapInstance.spawn.mock.calls[0][1][1]).toBe('deploy')
    expect(miraBootstrapInstance.spawn.mock.calls[0][1][2]).toBe('--app')
    expect(miraBootstrapInstance.spawn.mock.calls[0][1][4]).toBe('--env=default')
    expect(miraBootstrapInstance.spawn.mock.calls[0][1][5]).toBe('--profile=mira-dev')
  })
})

describe('MiraBootstrap getFirstFailedNestedStackName', () => {
  const miraBootstrapInstance = new MiraBootstrap()
  MiraConfig.getEnvironment = jest.fn().mockReturnValue({
    env: {
      account: '101259067028',
      region: 'eu-west-1'
    },
    profile: 'mira-dev',
    name: 'default'
  })
  it('gets first CREATE_FAILED NestedStack', async () => {
    miraBootstrapInstance.getAwsSdkConstruct = jest.fn().mockReturnValue({
      describeStackEvents: () => {
        return {
          promise: () => {
            return Promise.resolve({
              StackEvents: [
                {
                  PhysicalResourceId: 'arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32',
                  ResourceStatus: 'CREATE_FAILED'
                }]
            })
          }
        }
      }
    })
    const rsp = await miraBootstrapInstance.getFirstFailedNestedStackName()
    expect(rsp).toEqual('arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32')
  })
  it('gets first UPDATE_FAILED NestedStack', async () => {
    miraBootstrapInstance.getAwsSdkConstruct = jest.fn().mockReturnValue({
      describeStackEvents: () => {
        return {
          promise: () => {
            return Promise.resolve({
              StackEvents: [
                {
                  PhysicalResourceId: 'arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32',
                  ResourceStatus: 'UPDATE_FAILED'
                }]
            })
          }
        }
      }
    })
    const rsp = await miraBootstrapInstance.getFirstFailedNestedStackName()
    expect(rsp).toEqual('arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32')
  })

  it('gets no NestedStack if ResourceStatus positive', async () => {
    miraBootstrapInstance.getAwsSdkConstruct = jest.fn().mockReturnValue({
      describeStackEvents: () => {
        return {
          promise: () => {
            return Promise.resolve({
              StackEvents: [
                {
                  PhysicalResourceId: 'arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32',
                  ResourceStatus: 'UPDATE_IN_PROGRESS'
                }]
            })
          }
        }
      }
    })
    const rsp = await miraBootstrapInstance.getFirstFailedNestedStackName()
    expect(rsp).toBeUndefined()
  })
})

describe('MiraBootstrap extractNestedStackError', () => {
  const miraBootstrapInstance = new MiraBootstrap()
  MiraConfig.getEnvironment = jest.fn().mockReturnValue({
    env: {
      account: '101259067028',
      region: 'eu-west-1'
    },
    profile: 'mira-dev',
    name: 'default'
  })
  const failedResourceCreation = {
    StackId: 'arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32',
    EventId: 'SiteBucket21DC2FA83-CREATE_FAILED-2020-07-10T10:02:37.320Z',
    StackName: 'Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG',
    LogicalResourceId: 'SiteBucket21DC2FA83',
    PhysicalResourceId: 'arn:aws:cloudformation:eu-west-1:101259067028:stack/Nf-S3Webhosting-Service-default-S3Webhosting0NestedStackS3Webhosting0NestedStackR-OSY009YIBDSG/b2e7f2d0-bd20-11ea-86e0-0a2c3f6a2a32',
    ResourceType: 'AWS::S3::Bucket',
    Timestamp: '2020-07-10T10:02:37.320Z',
    ResourceStatus: 'CREATE_FAILED',
    ResourceStatusReason: 'Resource creation cancelled',
    ResourceProperties: '{"BucketName":"someName"}'
  }
  miraBootstrapInstance.getAwsSdkConstruct = jest.fn().mockReturnValue({
    describeStackEvents: () => {
      return {
        promise: () => {
          return Promise.resolve({
            StackEvents: [
              failedResourceCreation
            ]
          })
        }
      }
    }
  })
  miraBootstrapInstance.getFirstFailedNestedStackName = jest.fn().mockReturnValue('some_stack_name')
  it('gets error from the nested stack if deploy is failed', async () => {
    const rsp = await miraBootstrapInstance.extractNestedStackError()
    expect(rsp).toEqual([failedResourceCreation])
  })
})
