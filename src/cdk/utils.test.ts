import {MiraStack} from './stack'
import {MiraApp} from './app'
import {MiraConfig} from '../config/mira-config'

import {Stack, CfnOutput, NestedStack} from '@aws-cdk/core'
import {MiraUtils} from "./utils";

jest.mock('config')

const add = jest.fn()

jest.mock('@aws-cdk/core', () => ({
  ...jest.requireActual('@aws-cdk/core'),
  CfnOutput: jest.fn(),
  Tags: {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    of: () => ({add})
  },
  Aspects: {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    of: () => ({add})
  }
}))

const getCallerIdentityFn = jest.fn().mockReturnValue({UserId: 'USERID:profile'})
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

describe('MiraUtils', () => {
  let app: MiraApp
  let stack: Stack
  beforeEach(() => {
    getUserFn.mockReset()
    getUserFn.mockImplementation(() => {
      return {User: {UserName: 'test-user'}}
    })

    app = new MiraApp()
    stack = new Stack(app.cdkApp, 'DefaultStack')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('addOutput without shouldExport calls CfnOutput one time', async () => {
    expect(
      await MiraUtils.addOutput(stack, 'DefaultStack', 'value', false)
    ).toEqual(undefined)
    expect(CfnOutput).toBeCalledTimes(1)
  })

  it('addOutput with shouldExport calls CfnOutput two times', async () => {
    const nestedSTack = new NestedStack(stack, 'test')

    expect(await MiraUtils.addOutput(nestedSTack, 'DefaultStack', 'value')).toEqual(
      undefined
    )
    expect(CfnOutput).toBeCalledTimes(2)
  })

  it('creates StringParameter correctly', async () => {
    const res = await MiraUtils.createParameter(
      stack,
      'Fullname',
      'description',
      'value'
    )
    expect(res.toString().split('/')[1]).toBe('DefaultStackFullnameParameter')
  })

  it('loadParameter with fullName divided by / correctly', async () => {
    const res = await MiraUtils.loadParameter(stack, 'Full/Name')
    expect(res.parameterName).toBe(`/${MiraConfig.calculateSharedResourceName('param')}/Full/Name`)
    expect(res.toString().split('/')[1]).toBe('FullNameParameter')
  })

  it('loadParameter with environment and fullName', async () => {
    const res = await MiraUtils.loadParameter(stack, 'Fullname')
    expect(res.parameterName).toBe(`/${MiraConfig.calculateSharedResourceName('param')}/DefaultStack/Fullname`)
    expect(res.toString().split('/')[1]).toBe('DefaultStackFullnameParameter')
  })
})
