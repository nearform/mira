import * as cdk from '@aws-cdk/core'
import chalk from 'chalk'
import config from 'config'
import { MiraStack } from './stack'
import { Stack } from '@aws-cdk/core'
import * as fs from 'fs'
import * as path from 'path'
import {
  getBaseStackName,
  getBaseStackNameFromParams
} from './constructs/config/utils'
import { Account, MiraConfig } from '../config/mira-config'
// eslint-disable-next-line
const minimist = require("minimist");

const args = minimist(process.argv)

export type MiraValidStack = typeof MiraStack | typeof cdk.Stack | typeof Function
type MiraStackList = Array<MiraValidStack>

/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export class MiraApp {
  cdkApp: cdk.App;
  static instance: MiraApp;
  mainStack: MiraStack;
  // serviceStack: MiraServiceStack;
  stackName: string;
  stacks: MiraStackList = [];
  static cliArgs = args

  // eslint-disable-next-line
  constructor() {
    MiraConfig.setDefaultEnvironmentName(args.env)
    if (!args.env) {
      args.env = MiraConfig.defaultEnvironmentName
    }
    if (!MiraApp.instance) {
      MiraApp.instance = this
    } else if (args.env !== 'test') {
      console.warn('MiraApp was instantiated twice outside a testing environment' +
        '.  This will likely cause CDK to fail or will cause unknown behavior.')
    }
  }

  /**
   * Load a single stack given the filename
   * @param {String} fileName (Optional) Can provide an arbitary name to
   * lookup if name exists in configs.
   */
  async getStack (fileName: string): Promise<MiraValidStack | boolean> {
    const stackFile = path.resolve(fileName)
    if (!fs.existsSync(stackFile)) {
      return false
    }

    const stackImport = await import(stackFile)
    if (!stackImport.default || !(stackImport.prototype instanceof cdk.Stack)) {
      for (const key in stackImport) {
        if (typeof stackImport[key] === 'function' && stackImport[key].prototype instanceof Stack) {
          return stackImport[key]
        }
      }
    }
    return stackImport.default as MiraValidStack
  }

  /**
   * Loads the stacks
   * @param {String} stackName (Optional) Can provide an arbitary name to
   * lookup if name exists in configs.
   */
  async getStacks (): Promise<MiraStackList> {
    const stacks: MiraStackList = []
    for (const fileName of MiraApp.getStackFiles()) {
      const stack = await this.getStack(fileName)
      if (!stack) {
        throw new Error(`The stack file ${fileName} doesn't exist`)
      }
      stacks.push(stack as MiraValidStack)
    }
    return stacks
  }

  /**
   * Gets the stack file from CLI.
   */
  static getStackFiles (): Array<string> {
    if (Array.isArray(args.file)) {
      return args.file
    }
    return args.file.split(',')
  }

  static getBaseStackName (suffix?: string): string {
    return getBaseStackName(suffix)
  }

  static getBaseStackNameFromParams (
    prefix: string,
    name: string,
    suffix?: string
  ): string {
    return getBaseStackNameFromParams(prefix, name, suffix)
  }

  /**
   * Initializes the app and stack.
   */
  async initialize (): Promise<void> {
    if (!this.cdkApp) {
      this.initializeApp()
    }

    const account: Account = MiraConfig.getEnvironment()
    const Stacks = await this.getStacks()

    if (!Stacks.length) {
      console.warn(
        'No stack found when initializing, please use the ' +
        '--stack=[StackName] flag ' +
        'when running this script.'
      )
    }
    try {
      const initializationList = []

      for (const idx in Stacks) {
        if (Stacks[idx].prototype instanceof MiraStack) {
          const MiraStackType = (Stacks[idx] as unknown) as typeof MiraStack
          const stack = new MiraStackType()
          if (!stack.props.disablePolicies) {
            stack.applyPolicies(stack.props.approvedWildcardActions)
          }
          initializationList.push(stack.initialized)
        } else if (Stacks[idx].prototype instanceof cdk.Stack) {
          const CdkStackType = (Stacks[idx] as unknown) as typeof cdk.Stack
          const stack = new CdkStackType(this.cdkApp, Stacks[idx].name, {
            env: {
              region: account.env.region,
              account: account.env.account
            }
          })
          initializationList.push(MiraStack.bootstrap(stack))
        } else if (typeof Stacks[idx] === 'function') {
          const StackType = (Stacks[idx] as unknown) as typeof Function
          StackType()
        }
      }

      await Promise.all(initializationList)

      if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
        this.cdkApp.synth()
      }
    } catch (e) {
      console.error(chalk.red('Failed:'), 'could not deploy the stack', e)
      process.exit(1)
    }
  }

  /**
   * Initializes the app.  Not much else to see here.
   */
  initializeApp (): void {
    this.cdkApp = new cdk.App()
  }

  static isVerbose (): boolean {
    return MiraApp.cliArgs.verbose && MiraApp.cliArgs.verbose !== 'false' &&
      MiraApp.cliArgs.verbose !== '0'
  }
}

/**
 * Gets the stack name.
 */
export const getStackName = (): string => {
  const stackName = getBaseStackNameFromParams(config.get('app.prefix'),
    config.get('app.name'), 'Service')
  return stackName
}

// Ensure we're within a CDK deploy context.
// TODO: This check is here to avoid that the deploy starts even
// when we want to deploy CICD or Domain Manager, since this file
// is imported this code below will run. I check that the command is
// executed with 'app.js' file as argument and nod 'ci-app.js' or 'domain.js'
if (args._.filter((arg: string) => arg.match(/app.js$/)).length > 0) {
  console.info(
    `>>> ${chalk.yellow('Initializing CDK for App')}: ${chalk.grey(args.file)}`
  )
  const app = new MiraApp()
  app.initialize()
}
