import { MiraApp } from './app'
import config from 'config'
import _ from 'lodash'
import mockConfig from './../config/__mocks__/default.json'
import yargs from 'yargs'
const assumeRoleMock = jest.fn()

jest.mock('../assume-role', () => ({
  assumeRole: assumeRoleMock
}))
const MiraBootstrap = require('./bootstrap').MiraBootstrap

jest.mock('config')

const mockConfigHandler = (mockConfig: any): void => {
  config.get = (key: string): any => _.get(mockConfig, key)
  config.has = (key: string): any => _.has(mockConfig, key)
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
  miraBootstrapInstance.spawn = jest.fn()
  it('throws error for missing dev.target', async () => {
    await expect(miraBootstrapInstance.deploy()).rejects.toThrow('Missing dev.target in your config file.')
  })
  it('do not calls assume role when no role provided in the cli', async () => {
    mockConfigHandler(mockConfig)
    miraBootstrapInstance.args = yargs(['']).argv

    await miraBootstrapInstance.deploy()
    expect(assumeRoleMock).toBeCalledTimes(0)
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
    miraBootstrapInstance.spawn.mockClear()
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
