import { MiraServiceStack, MiraStack } from './stack'
import { MiraApp } from './app'
import { MiraConfig } from '../config/mira-config'

import { Stack, CfnOutput, Tag } from '@aws-cdk/core'
jest.mock('config')

jest.mock('@aws-cdk/core', () => ({
  ...jest.requireActual('@aws-cdk/core'),
  CfnOutput: jest.fn()
}))

jest.mock('aws-sdk', () => ({
  ...jest.requireActual('aws-sdk'),
  IAM: jest.fn().mockReturnValue({
    getUser: () => ({
      promise: jest.fn().mockReturnValue({ User: { UserName: 'test-user' } })
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
  const app = new MiraApp()

  it('applyPolicies calls applyAspect', () => {
    const miraServiceStackInstance = new MiraServiceStack(app, 'env')
    miraServiceStackInstance.node.applyAspect = jest.fn()
    expect(miraServiceStackInstance.applyPolicies([])).toEqual(undefined)
    expect(miraServiceStackInstance.node.applyAspect).toBeCalledTimes(1)
  })

  it('has app initialized', async () => {
    const miraServiceStackInstance = new MiraServiceStack(app, 'env', 'sufix')
    // Because the resolved promise doesn't return anything
    // this "undefined" test is actually testing if there was no errors
    expect(await miraServiceStackInstance.initialize()).toEqual(undefined)
    expect(await miraServiceStackInstance.initialized).toBe(undefined)
  })
})

describe('MiraStack', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const stack = new Stack()

  it('has app initialized', async () => {
    const miraStackInstance = new MiraStack(stack, 'Default', {})
    expect(await miraStackInstance.initialize()).toEqual(undefined)
    expect(await miraStackInstance.initialized).toBe(undefined)
    expect(miraStackInstance.parent).toBe(stack)
    expect(miraStackInstance.name).toBe('Default')
  })

  it('addOutput without shouldExport calls CfnOutput one time', async () => {
    const miraStackInstance = new MiraStack(stack)
    expect(
      await miraStackInstance.addOutput('DefaultStack', 'value', false)
    ).toEqual(undefined)
    expect(miraStackInstance.parent).toBe(stack)
    expect(miraStackInstance.name).toBe('DefaultStack')
    expect(CfnOutput).toBeCalledTimes(1)
  })

  it('addOutput with shouldExport calls CfnOutput two times', async () => {
    const miraStackInstance = new MiraStack(stack)
    expect(await miraStackInstance.addOutput('DefaultStack', 'value')).toEqual(
      undefined
    )
    expect(CfnOutput).toBeCalledTimes(2)
  })

  it('creates StringParameter correctly', async () => {
    const miraStackInstance = new MiraStack(stack)
    const res = await miraStackInstance.createParameter(
      'Fullname',
      'description',
      'value'
    )
    expect(res.toString().split('/')[2]).toBe('DefaultStackFullnameParameter')
  })

  it('loadParameter with fullName divided by / correctly', async () => {
    const miraStackInstance = new MiraStack(stack)
    const res = await miraStackInstance.loadParameter('Full/Name')
    expect(res.parameterName).toBe('/default/Full/Name')
    expect(res.toString().split('/')[2]).toBe('FullNameParameter')
  })

  it('loadParameter with environment and fullName', async () => {
    const miraStackInstance = new MiraStack(stack, 'Default')
    const res = await miraStackInstance.loadParameter('Fullname')
    expect(res.parameterName).toBe('/default/Default/Fullname')
    expect(res.toString().split('/')[2]).toBe('DefaultFullnameParameter')
  })
})

describe('MiraStack Tags', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Adds default tags', async () => {
    Tag.add = jest.fn()
    const app = new MiraApp()
    const miraStackInstance = new MiraServiceStack(app, 'env')
    await miraStackInstance.initialized

    expect(Tag.add).toHaveBeenCalledTimes(2)
  })

  it('Adds default tags and cost center', async () => {
    Tag.add = jest.fn()
    MiraConfig.getCostCenter = jest.fn().mockReturnValue('123')
    const app = new MiraApp()
    const miraStackInstance = new MiraServiceStack(app, 'env')
    await miraStackInstance.initialized

    expect(Tag.add).toHaveBeenCalledTimes(3)
  })
})
