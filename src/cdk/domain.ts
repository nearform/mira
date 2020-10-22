import * as cdk from '@aws-cdk/core'

import { MiraConfig } from '../config/mira-config'
import chalk from 'chalk'
import minimist from 'minimist'

import { MiraApp } from './app'
import { CertificateManager } from './constructs/domain-manager/resource/certificate-manager'
import { Route53Manager } from './constructs/domain-manager/resource/route53-manager'
import { Route53ManagerAccessRole } from './constructs/domain-manager/resource/route53-manager-access-role'

const args = minimist(process.argv)

/**
 * Main Mira class. Bootstraps CDK and loads in Stacks per user input.
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

    if (args.env === 'domain') {
      new Route53Manager(stack)
      new Route53ManagerAccessRole(stack)
    } else {
      new CertificateManager(stack)
    }

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

if (args._.filter((arg: string) => arg.match(/domain.js$/)).length > 0) {
  // Ensure we're within a CDK deploy context.
  console.info(`>>> ${chalk
    .yellow('Initializing CDK for DomainManager')}:\n    ${chalk.grey(args.stack)}`)
  const app = new MiraDomainApp()
  app.initialize()
}
