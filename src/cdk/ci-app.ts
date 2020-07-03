import * as cdk from '@aws-cdk/core'
import { Cicd, PipelineEnvironmentVariable } from './constructs/cicd'
import * as aws from 'aws-sdk'
import { MiraConfig } from '../config/mira-config'
import chalk from 'chalk'
// eslint-disable-next-line
const minimist = require('minimist')

const args = minimist(process.argv)

/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export class MiraCiApp {
    cdkApp: cdk.App;
    instance: MiraCiApp;
    stackName: string;
    stacks: any = {};

    // eslint-disable-next-line
    constructor () {
      MiraConfig.setDefaultEnvironmentName(args.env)
    }

    /**
     * Initializes the app and stack.
     */
    async initialize (): Promise<void> {
      if (!this.cdkApp) {
        this.initializeApp()
      }
      const config = MiraConfig.getCICDConfig()
      const callerIdentityResponse = await this.getCallerIdentityResponse(args.profile || config.account.profile)
      const envVars = this.parsePipelineEnvironmentVariables()
      new Cicd(this.cdkApp, {
        callerIdentityResponse,
        environmentVariables: envVars,
        env: config.account.env
      })
      if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
        this.cdkApp.synth()
      }
    }

    async getCallerIdentityResponse (profile: string): Promise<aws.STS.Types.GetCallerIdentityResponse> {
      aws.config.credentials = new aws.SharedIniFileCredentials({ profile })
      const sts = new aws.STS()
      const callerIdentityResponse = await sts.getCallerIdentity().promise()
      return callerIdentityResponse
    }

    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp (): void {
      this.cdkApp = new cdk.App()
    }

    private parsePipelineEnvironmentVariables (): PipelineEnvironmentVariable[] {
      let output = []
      if (args.envVar) {
        output = args.envVar
          .split(',')
          .map((keyValue: string) => {
            const [key, value] = keyValue.split('=')
            return { key, value }
          })
      }
      return output
    }
}
if (args._[1].match(/ci-app.js$/).length > 0) {
  // Ensure we're within a CDK deploy context.
  console.info(`>>> ${chalk
        .yellow('Initializing CDK for CI')}:\n    ${chalk.grey(args.stack)}`)
  const app = new MiraCiApp()
  app.initialize()
}
