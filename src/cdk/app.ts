import * as cdk from '@aws-cdk/core'
import chalk from 'chalk'
import { MiraServiceStack, MiraStack } from './stack'
import { Stack } from '@aws-cdk/core'
import * as fs from 'fs'
import * as path from 'path'
import { getBaseStackName } from './constructs/config/utils'
import { MiraConfig } from '../config/mira-config'
// eslint-disable-next-line
const minimist = require('minimist')

const args = minimist(process.argv)

/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export class MiraApp {
  cdkApp: cdk.App;
  instance: MiraApp;
  mainStack: MiraStack;
  serviceStack: MiraServiceStack;
  stackName: string;
  stacks: any = {};
  appStacks: any = {};

  // eslint-disable-next-line
  constructor () {
    MiraConfig.setDefaultEnvironmentName(args.env)
  }

  /**
   * Load a single stack given the filename
   * @param {String} fileName (Optional) Can provide an arbitary name to
   * lookup if name exists in configs.
   */
  async getStack (fileName: string): Promise<Stack | boolean> {
    const stackFile = path.resolve(fileName)
    if (!fs.existsSync(stackFile)) {
      return false
    }

    const stackImport = await import(stackFile)
    return stackImport.default as Stack
  }

  /**
   * Loads the stacks
   * @param {String} stackName (Optional) Can provide an arbitary name to
   * lookup if name exists in configs.
   */
  async getStacks (): Promise<Array<Stack>> {
    const stacks: Array<Stack> = []
    for (const fileName of MiraApp.getStackFiles()) {
      const stack = await this.getStack(fileName)
      if (!stack) {
        throw new Error(`The stack file ${fileName} doesn't exist`)
      }
      stacks.push(stack as Stack)
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

  /**
   * Gets the stack name from CLI.
   */
  static getStackName (): string {
    return args.stack || 'default'
  }

  static getBaseStackName (suffix?: string): string {
    return getBaseStackName(suffix)
  }

  /**
   * Initializes the app and stack.
   */
  async initialize (): Promise<void> {
    if (!this.cdkApp) {
      this.initializeApp()
    }

    const Stacks = await this.getStacks() as any

    if (!Stacks.length) {
      console.warn('No stack found when initializing, please use the ' +
        '--stack=[StackName] flag ' +
        'when running this script.')
    }
    try {
      const initializationList = []

      if (Stacks[0].prototype instanceof MiraStack) {
        const serviceStack = new MiraServiceStack(this, args.env)
        initializationList.push(serviceStack.initialized)
        for (const Stack of Stacks) {
          const stack = new Stack(serviceStack)
          if (!stack.props.disablePolicies) {
            serviceStack.applyPolicies(stack.props.approvedWildcardActions)
          }
          initializationList.push(stack.initialized)
        }
      } else if (Stacks[0].prototype instanceof MiraServiceStack) {
        for (const Stack of Stacks) {
          const stack = new Stack(this)
          initializationList.push(stack.initialized)
        }
      } else {
        new Stacks[0](this.cdkApp)
      }

      await Promise.all(initializationList)

      if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
        this.cdkApp.synth()
      }
    } catch (e) {
      console.error(chalk.red('Failed:'), 'could not deploy the stack',
        e)
      process.exit(1)
    }
  }

  /**
   * Initializes the app.  Not much else to see here.
   */
  initializeApp (): void {
    this.cdkApp = new cdk.App()
  }
}

if (args.stack) {
  // Ensure we're within a CDK deploy context.
  // TODO: This check is here to avoid that the deploy starts even
  // when we want to deploy CICD or Domain Manager, since this file
  // is imported this code below will run. I check that the command is
  // executed with 'app.js' file as argument and nod 'ci-app.js' or 'domain.js'
  if (args._.filter((arg: string) => arg.match(/app.js$/)).length > 0) {
    console.info(`>>> ${chalk
      .yellow('Initializing CDK for App')}:\n    ${chalk.grey(args.file)}`)
    const app = new MiraApp()
    app.initialize()
  }
}
