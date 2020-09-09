import * as cdk from '@aws-cdk/core'
import * as aws from 'aws-sdk'
import { NestedStack } from '@aws-cdk/aws-cloudformation'
import { CfnOutput, Construct, Stack, Aspects, Tags } from '@aws-cdk/core'
import { IStringParameter, StringParameter } from '@aws-cdk/aws-ssm'
import { Policies } from './aspects/security/policies'
import { MiraConfig, Account } from '../config/mira-config'
import { MiraApp } from './app'

interface ParsedName {
  readonly id: string
  readonly parameterName: string
}

/**
 * The main Mira stack.  Responsible for provisioning IAM role / CodePipeline.
 * There is a 1:1 relationship between the service stack and the app.  This
 * makes provisioning a CICD more organized within a single app and keeps the
 * CloudFormation stack listing likewise de-cluttered.
 */
export class MiraServiceStack extends cdk.Stack {
    initialized: Promise<unknown>;

    constructor (app: MiraApp, environment: string, suffix?: string) {
      const account: Account = MiraConfig.getEnvironment(environment)
      let stackName = `${MiraApp.getBaseStackName('Service')}-${account.name}`
      if (suffix) {
        stackName += `-${suffix}`
      }
      super(app.cdkApp, stackName, {
        env: {
          region: account.env.region,
          account: account.env.account
        }
      })

      this.initialized = new Promise((resolve) => {
        setTimeout(async () => {
          await this.initialize()
          resolve()
        }, 1)
      })
    }

    /**
     * Applies security policies.
     */
    applyPolicies (customList?: string[]): void {
      Aspects.of(this).add(new Policies(customList))
    }

    /**
     * Initialize this component in some async way.
     */
    async initialize (): Promise<unknown> {
      const iam = new aws.IAM()
      const owner = await iam.getUser().promise()

      Tags.of(this).add('StackName', this.stackName)
      Tags.of(this).add('CreatedBy', owner.User.UserName)

      const costCenter = MiraConfig.getCostCenter()

      if (costCenter) {
        Tags.of(this).add('CostCenter', costCenter)
      }

      return Promise.resolve()
    }
}

/**
 * @class Object containing persistent state for MiraStack.  This generally
 * is instantiated and attached one time, but is useful as a class object for
 * testing purposes to cleanly wipe and configure state.
 */
class MiraStackState {
  /**
   * Stores stack instances by name.
   */
  stackInstances = {}
}

export interface ExportOutputs {
  addOutput (name: string, value: string, shouldExport: boolean): void
}

interface MiraStackProps {
  disablePolicies?: boolean
  approvedWildcardActions?: string[]
  [x: string]: unknown
}

/**
 * Note that in Mira, a "stack" is always nested within a service context to
 * support CICD out of the box.
 */
export class MiraStack extends NestedStack implements ExportOutputs {
    initialized: Promise<unknown>;
    static stackInstances: Record<string, Stack[]>;
    parent: Construct
    name: string
    props: MiraStackProps

    constructor (parent: Construct, name?: string, props?: MiraStackProps) {
      if (!name) {
        name = 'DefaultStack'
      }
      if (!MiraStack.stackInstances[name]) {
        MiraStack.stackInstances[name] = []
      }
      const id = MiraStack.stackInstances[name].length

      super(parent, `${name}-${id}`)
      this.parent = parent
      this.name = name
      this.props = props || {}
      MiraStack.stackInstances[name].push(this)
      this.initialized = new Promise((resolve) => {
        setTimeout(async () => {
          await this.initialize()
          resolve()
        }, 1)
      })
    }

    /**
   * Adds an output to the stack.
   * @param name
   * @param value
   * @param shouldExport
   */
    addOutput (name: string, value: string, shouldExport = true): void {
      const exportName = name
      new CfnOutput((this as unknown) as Construct, name, {
        value: value
      })

      if (shouldExport) {
        new CfnOutput(this.parent, exportName, {
          value: value
        })
      }
    }

    /**
   * Initialize this component in an asynchronous manner.
   */
    initialize (): Promise<unknown> {
      return Promise.resolve()
    }

    createParameter (fullName: string, description: string, value: string): StringParameter {
      const { id, parameterName } = this.parseParameterName(fullName)

      return new StringParameter(this, id, {
        description,
        parameterName,
        stringValue: value
      })
    }

    loadParameter (fullName: string): IStringParameter {
      const { id, parameterName } = this.parseParameterName(fullName)
      return StringParameter.fromStringParameterAttributes(this, id, {
        parameterName
      })
    }

    private parseParameterName (fullName: string): ParsedName {
      const nameParts = fullName.split('/')
      const baseName = nameParts.length === 1 ? this.name : nameParts[0]
      const name = nameParts.length === 1 ? nameParts[0] : nameParts[1]

      const id = `${baseName}${name}Parameter`
      const parameterName = `/${MiraApp.getStackName()}/${baseName}/${name}`

      return { id, parameterName }
    }
}

// Attach the default state.
Object.assign(MiraStack, new MiraStackState())
