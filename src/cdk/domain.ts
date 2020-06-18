import * as cdk from '@aws-cdk/core'
import { CertificateManager } from './constructs/domain/certificate-manager'
import { Route53Manager } from './constructs/domain/route53-manager'
import { Route53ManagerAccessRoleStack } from './constructs/domain/route53-manager-access-role'
import { MiraConfig } from '../config/mira-config'
import chalk from 'chalk'
import minimist from 'minimist'

import { MiraApp } from './app'

const args = minimist(process.argv)

/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export class MiraDomainApp extends MiraApp {
  constructor () {
    super()
    MiraConfig.setDefaultEnvironmentName(args.env)
  }

  /**
   * Initializes the app and stack.
   */
  async initialize (): Promise<void> {
    if (!this.cdkApp) {
      this.initializeApp()
    }
    const stack = new cdk.Stack(this.cdkApp, MiraConfig.getBaseStackName('DomainManager'), { })

    new CertificateManager(stack)
    new Route53Manager(stack)
    new Route53ManagerAccessRoleStack(stack)
    if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
      this.cdkApp.synth()
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
  console.info(`>>> ${chalk
    .yellow('Initializing CDK for DomainManager')}:\n    ${chalk.grey(args.stack)}`)
  const app = new MiraDomainApp()
  app.initialize()
}
