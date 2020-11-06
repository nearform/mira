import * as cdk from '@aws-cdk/core'
import * as aws from 'aws-sdk'
import { NestedStack } from '@aws-cdk/aws-cloudformation'
import { Construct, Aspects, Tags } from '@aws-cdk/core'
import { Policies } from './aspects/security/policies'
import { MiraConfig, Account } from '../config/mira-config'
import { MiraApp } from './app'

interface LooseObject {
  /* eslint-disable-next-line */
  [key: string]: any
}

interface MiraStackProps {
  disablePolicies?: boolean
  approvedWildcardActions?: string[]
  [x: string]: unknown
}

export class MiraStack {
  /* eslint-disable-next-line */
  initialized: Promise<any>
  name: string
  parent?: Construct
  props: MiraStackProps
  stack: cdk.Stack
  static topLevelStacks: LooseObject
  constructor (parentOrName?: Construct|string, name?: string, existingStack?: cdk.Stack, props?: MiraStackProps) {
    if (typeof parentOrName !== 'string' && !name) {
      name = 'DefaultStack'
      console.warn('No stack name provided, prefer a named stack.  Defaulting ' +
        'to name \'DefaultStack\'')
    } else if (!name && typeof parentOrName === 'string') {
      name = parentOrName
    }
    this.name = name as string
    if (!parentOrName && typeof parentOrName !== 'string') {
      this.parent = MiraApp.instance.cdkApp
    } else {
      this.parent = parentOrName as Construct
    }
    this.props = props || {}
    if (existingStack) {
      this.stack = existingStack
    }
    /* eslint-disable-next-line */
    this.initialized = new Promise(async (resolve) => {
      try {
        await this.initialize()
        resolve()
      } catch (e) {
        console.warn(`Initialization of ${this.constructor.name} object failed:`, e)
        throw new Error(e)
      }
    })
  }

  /**
   * Adds tags to the stack.
   */
  async addTags (): Promise<void> {
    try {
      const createdBy = await this.getUser()

      Tags.of(this.stack).add('StackName',
        MiraConfig.getResourceName('stack', this.name))
      Tags.of(this.stack).add('CreatedBy', createdBy)

      const costCenter = MiraConfig.getCostCenter()

      if (costCenter) {
        Tags.of(this.stack).add('CostCenter', costCenter)
      }
    } catch (e) {
      console.warn('An error occurred while setting tags.', e)
    }
  }

  /**
   * Applies security policies.
   */
  applyPolicies (customList?: string[]): void {
    Aspects.of(this.stack).add(new Policies(customList))
  }

  /**
   * Bootstraps some external stack.
   */
  /* eslint-disable-next-line */
  static bootstrap (stack: cdk.Stack): Promise<any> {
    const obj = new MiraStack(stack.stackName, undefined, stack)
    return obj.initialized
  }

  /**
   * Get a username either from the IAM service or from STS.
   */
  async getUser (): Promise<string> {
    const iam = new aws.IAM()
    let owner
    let createdBy: string
    try {
      owner = await iam.getUser().promise()
      createdBy = owner.User.UserName
    } catch (e) {
      const sts = new aws.STS()
      owner = await sts.getCallerIdentity().promise()
      // this is only needed because of Typescript since we use the getCallerIdentity call only when the iam.getUser call fails
      // and that only happens when an assumed role is used instead of an actual user profile
      // in this case the UserId property will be there and the actual userId will be used since it is not possible to get the actual user name
      createdBy = owner.UserId ? owner.UserId.split(':')[0] : 'usr'
    }
    return createdBy
  }

  async initialize (): Promise<void> {
    const account: Account = MiraConfig.getEnvironment(MiraApp.cliArgs.env)
    if (!this.stack && this.parent && this.parent instanceof MiraStack) {
      this.stack = new NestedStack(this.parent.stack,
        MiraConfig.getResourceName('nestedstack', this.name))
    } else if (!this.stack) {
      this.stack = new cdk.Stack(MiraApp.instance.cdkApp,
        MiraConfig.getResourceName('stack', this.name), {
          env: {
            region: account.env.region,
            account: account.env.account
          }
        })
    }
    await this.addTags()
    // Add more logic here.
    if (!this.props.disablePolicies) {
      this.applyPolicies(this.props.approvedWildcardActions)
    }
  }
}
