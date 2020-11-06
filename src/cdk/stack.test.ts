import { MiraStack } from './stack'
import { MiraApp } from './app'
import { MiraConfig } from '../config/mira-config'

import { Stack, CfnOutput } from '@aws-cdk/core'
jest.mock('config')

const add = jest.fn()

jest.mock('@aws-cdk/core', () => ({
  ...jest.requireActual('@aws-cdk/core'),
  CfnOutput: jest.fn(),
  Tags: {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    of: () => ({ add })
  },
  Aspects: {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    of: () => ({ add })
  }
}))

const getCallerIdentityFn = jest.fn().mockReturnValue({ UserId: 'USERID:profile' })
const getUserFn = jest.fn()
jest.mock('aws-sdk', () => ({
  ...jest.requireActual('aws-sdk'),
  IAM: jest.fn().mockReturnValue({
    getUser: () => ({
      promise: getUserFn // jest.fn().mockReturnValue({ User: { UserName: 'test-user' } })
    })
  }),
  STS: jest.fn().mockReturnValue({
    getCallerIdentity: () => ({
      promise: getCallerIdentityFn
    })
  })
}))

MiraConfig.getEnvironment = jest.fn().mockReturnValue({
  env: {
    account: '101259067028',
    region: 'eu-west-1'
  },
  profile: 'mira-dev',
  name: 'default'
})

describe('MiraServiceStack', () => {
  beforeEach(() => {
    getUserFn.mockReset()
    getUserFn.mockImplementation(() => {
      return { User: { UserName: 'test-user' } }
    })
  })

  const app = new MiraApp()

  it('applyPolicies calls applyAspect', () => {
    const miraServiceStackInstance = new MiraStack(app.cdkApp, 'env')
    expect(miraServiceStackInstance.applyPolicies([])).toEqual(undefined)
    expect(add).toBeCalledTimes(1)
  })

  it('has app initialized', async () => {
    const miraServiceStackInstance = new MiraStack(app.cdkApp, 'env')
    // Because the resolved promise doesn't return anything
    // this "undefined" test is actually testing if there was no errors
    expect(await miraServiceStackInstance.initialized).toBe(undefined)
  })

  it('falls back to STS when IAM getUser call fails', async () => {
    getUserFn.mockReset()
    getUserFn.mockImplementation(() => {
      throw new Error('err')
    })
    const miraServiceStackInstance = new MiraStack(app.cdkApp, 'env')
    // // Because the resolved promise doesn't return anything
    // // this "undefined" test is actually testing if there was no errors
    expect(await miraServiceStackInstance.initialized).toBe(undefined)
    expect(getCallerIdentityFn).toHaveBeenCalled()
  })
})

describe('MiraStack', () => {
  beforeEach(() => {
    getUserFn.mockReset()
    getUserFn.mockImplementation(() => {
      return { User: { UserName: 'test-user' } }
    })
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  const app = new MiraApp()
  const stack = new Stack(app.cdkApp, 'some-random-id')

  it('has app initialized', async () => {
    const miraStackInstance = new MiraStack(stack, 'Default')
    expect(await miraStackInstance.initialized).toBe(undefined)
    expect(miraStackInstance.parent === stack).toBe(true)
    expect(miraStackInstance.name).toBe('Default')
  })
})

describe('MiraStack Tags', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Adds default tags', async () => {
    const app = new MiraApp()
    const miraStackInstance = new MiraStack(app.cdkApp, 'env')
    await miraStackInstance.initialized

    // It calls Tags.of and then calls Aspects.of
    expect(add).toHaveBeenCalledTimes(3)
  })

  it('Adds default tags and cost center', async () => {
    MiraConfig.getCostCenter = jest.fn().mockReturnValue('123')
    const app = new MiraApp()
    const miraStackInstance = new MiraStack(app.cdkApp, 'env')
    await miraStackInstance.initialized

    // It calls Tags.of and then calls Aspects.of
    expect(add).toHaveBeenCalledTimes(4)
  })
})
