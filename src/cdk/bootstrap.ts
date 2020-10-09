import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { ParsedArgs } from 'minimist'
import { spawn } from 'child_process'
import { MiraApp } from './app'
import { Account, MiraConfig } from '../config/mira-config'
import configWizard from './constructs/config/make-default-config'
import { assumeRole } from '../assume-role'
import yargs from 'yargs'
import Transpiler from '../transpiler'
import * as JsonValidation from '../jsonvalidator'
import configModule from 'config'
import aws from 'aws-sdk'
import CloudFormation, { StackEvent } from 'aws-sdk/clients/cloudformation'
import ChangeDetector from '../change-detector'
import ErrorLogger from '../error-logger'

type ValidAwsContruct = CloudFormation

/**
 * @class Responsible for beaming up bits to AWS.  Teleportation device not
 * included.
 */
export class MiraBootstrap {
  app: MiraApp;
  spawn: typeof spawn;
  args: ParsedArgs;
  env: string;
  profile: string;
  cdkCommand: string;
  docsifyCommand: string
  stackFile: string
  errorLogger: ErrorLogger

  constructor () {
    this.cdkCommand = path.join(require.resolve('aws-cdk'), '..', '..', 'bin', 'cdk')
    this.docsifyCommand = path.join(require.resolve('docsify-cli'), '..', '..', 'bin', 'docsify')

    this.app = new MiraApp()
    this.errorLogger = new ErrorLogger()
    this.spawn = spawn
  }

  /**
   * Orchestration used for deployment of the given application. This is used whenever developer or CI will try to
   * deploy application. It is important to keep this function as a single place for application deployment so, development environment
   * will have the same deployment process as CI owned environments.
   *
   * @param undeploy
   */
  async deploy (undeploy = false): Promise<void> {
    const envConfig = MiraConfig.getEnvironment(this.env)
    this.env = envConfig.name
    if (this.args.role) {
      try {
        await assumeRole(this.args.role)
      } catch (error) {
        console.warn(chalk.red('Error Assuming Role'), error.message)
        return
      }
    }
    let cmd = 'deploy'
    if (undeploy) {
      cmd = 'destroy'
    }

    const additionalArgs = []
    if (Object.keys(this.args).includes('outputs-file')) {
      additionalArgs.push(`--outputs-file=${this.args['outputs-file']}`)
      delete this.args['outputs-file']
    }

    if (Object.keys(this.args).includes('stackName')) {
      additionalArgs.push(this.args.stackName)
      delete this.args.stackName
    }

    if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
      cmd = 'synth'
    }
    const commandOptions = [
      this.cdkCommand,
      cmd,
      '--app', this.getCDKArgs('app.js'),
      envConfig.name ? `--env=${envConfig.name}` : '',
      this.env ? `--profile=${this.getProfile(this.env)}` : '',
      ...additionalArgs
    ]

    const proc = this.spawn(
      'node',
      commandOptions, {
        stdio: 'inherit',
        env: {
          NODE_ENV: 'dev',
          ...process.env
        }
      })
    await new Promise((resolve) => {
      proc.on('exit', async (code) => {
        if (code !== 0) {
          await this.printExtractedNestedStackErrors()
        }
        resolve()
      })
    })
  }

  /**
   * Orchestration for `npx mira cicd` command. As an effect, CodePipeline and related services will be deployed together
   * with permission stacks deployed to the target accounts.
   */
  async deployCi (): Promise<void> {
    const permissionFilePath = MiraConfig.getPermissionsFilePath()
    if (!permissionFilePath) {
      console.error('Permissions file path must be specified either in cicd config or as --file parameter.')
      throw new Error('Permissions file path must be specified either in cicd config or as --file parameter.')
    }

    const ciTargetAccounts: Account[] = MiraConfig.getCICDAccounts()

    let cmd = 'deploy'
    if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
      cmd = 'synth'
    }
    for (const account of ciTargetAccounts) {
      const commandOptions = [
        this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
        cmd,
        '--app', this.getCDKArgs('app.js', true, account.name),
        account.name ? `--profile=${this.getProfile(account.name)}` : ''
      ]
      console.log(chalk.cyan(`Starting deployment of CI ${account.name} permissions to Account: ${account.env.account} in ${account.env.region} with profile ${account.profile}.`))
      const proc = this.spawn(
        'node',
        commandOptions, {
          stdio: 'inherit',
          env: {
            ...process.env
          }
        })
      await new Promise((resolve) => {
        proc.on('exit', () => {
          resolve()
        })
      })
      console.log(chalk.green(`Done deploying CI ${account.name} permissions.`))
    }

    console.log(chalk.cyan(`Starting deployment of CI pipeline to Account: ${MiraConfig.getCICDConfig().account.env.account} in ${MiraConfig.getCICDConfig().account.env.region} with profile ${MiraConfig.getCICDConfig().account.profile}.`))

    const commandOptions = [
      this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
      cmd,
      '--app', this.getCDKArgs('ci-app.js'),
      `--profile=${this.getProfile('cicd')}`
    ]
    const proc = this.spawn(
      'node',
      commandOptions, {
        stdio: 'inherit',
        env: {
          ...process.env
        }
      })
    await new Promise((resolve) => {
      proc.on('exit', () => {
        resolve()
      })
    })
    console.log(chalk.green('Done deploying CI pipeline.'))
  }

  /**
   * Runs docsify web server with the mira docs.
   */
  runDocs (): void {
    const commandOptions = [
      this.docsifyCommand + (process.platform === 'win32' ? '.cmd' : ''),
      'serve',
      path.join(__dirname, '..', '..', '..', 'docs')
    ]
    try {
      this.spawn(
        'node',
        commandOptions, {
          stdio: 'inherit',
          env: {
            ...process.env
          }
        })
    } catch (error) {
      console.error(error.message)
      process.exit(error.status)
    }
  }

  /**
   * TODO: check this functionality together with sample app that supports custom domain.
   */
  deployDomain (): void {
    console.log('deploying domain')
    const envConfig = MiraConfig.getEnvironment(this.env)
    let cmd = 'deploy'
    if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
      cmd = 'synth'
    }

    const commandOptions = [
      this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
      cmd,
      '--app', this.getCDKArgs('domain.js'),
      `--env=${envConfig.name}`,
      `--profile=${this.getProfile(this.env)}`
    ]
    try {
      this.spawn(
        'node',
        commandOptions, {
          stdio: 'inherit',
          env: {
            ...process.env
          }
        })
    } catch (error) {
      console.error(error.message)
      process.exit(error.status)
    }
  }

  /**
   * Gets the arguments parsed by the app file provided for the CDK CLI.
   * @param filename - main application file.
   * @param isCi - when "npx mira cicd" command is executed permissions file path is taken from the config.file, NOT from the CLI param.
   * @param env - name of current target environment where the stack with role is going to be deployed.
   */
  getCDKArgs (filename: string, isCi = false, env?: string): string {
    const resultedEnv = this.env || env
    const q = process.platform === 'win32' ? '"' : '\''
    let appPath = path.resolve(__dirname, filename)

    if (fs.existsSync('node_modules/mira')) {
      if (fs.lstatSync('node_modules/mira/dist').isSymbolicLink()) {
        // Mira has been locally linked.
        try { fs.mkdirSync('node_modules/mira-bootstrap') } catch (e) {
          // NOOP
        }
        fs.writeFileSync(`node_modules/mira-bootstrap/bootstrap-${filename}`,
          `require('mira/dist/src/cdk/${filename}')`, 'utf8')
        appPath = `node_modules/mira-bootstrap/bootstrap-${filename}`
      }
    }
    let appArg = `${q}node --preserve-symlinks "${appPath}" `
    // Still inside the quotes, explode the args.
    // appArg += this.getArgs().join(' ')
    appArg += this.stackFile ? ` --file=${this.stackFile}` : ''
    appArg += resultedEnv ? ` --env=${resultedEnv}` : ''
    appArg += isCi ? ` --file=${MiraConfig.getPermissionsFilePath()}` : ''
    appArg += q // End quote.
    return appArg
  }

  /**
   * Gets the arguments for this stack. It has built-in support for osx/win support.
   */
  getArgs (): string[] {
    // eslint-disable-next-line no-useless-rename, @typescript-eslint/no-unused-vars
    const { _: _, ...args } = this.args
    const newArgs: string[] = []

    for (const key of Object.keys(args)) {
      if (args[key]?.includes && args[key].includes(' ')) {
        const q = process.platform !== 'win32' ? '\'' : '"'
        args[key] = q + args[key] + q
      } else if (typeof args[key] === 'boolean') {
        newArgs.push(`--${key}`)
        continue
      }
      newArgs.push(`--${key}`, args[key])
    }

    return newArgs
  }

  /**
   * Gets the profile given the env.
   */
  getProfile (environment: string): string | void {
    // if we are in Codebuild environment, return 'client' which is the one set by assume-role
    if (process.env.CODEBUILD_CI) {
      return 'client'
    }
    const envConfig = MiraConfig.getEnvironment(environment)
    if (envConfig) {
      return envConfig.profile
    }
    if (this.profile) {
      return this.profile
    }
  }

  /**
   * Verifies wether files provided in the CLI exists.
   */
  async areStackFilesValid (): Promise<boolean> {
    let isValid = true
    for (const stackName of [this.stackFile]) {
      if (!(await this.app.getStack(stackName))) {
        console.warn(chalk.yellow('Stack Not Found:'), stackName)
        isValid = false
      }
    }
    return isValid
  }

  /**
   * Function being called when CLI is invoked.
   */
  async initialize (): Promise<void> {
    this.args = this.showHelp()

    this.env = this.args.env
    this.profile = this.args.profile
    if (Object.keys(this.args).includes('env')) {
      delete this.args.env
    }
    const rawConfig = configModule.util.toObject()
    const cmd = this.args._[0]
    const cd = new ChangeDetector(process.cwd())
    const filesChanged = await cd.run()
    let transpiledStackFile
    switch (cmd) {
      case 'domain':
        this.deployDomain()
        break
      case 'init':
        configWizard()
        break
      case 'deploy':
        if (!this.args.file) {
          console.warn(chalk.red('Error Initializing'), 'Must supply' +
            ' a --file=<stackFile> argument.')
          return
        }
        if (!JsonValidation.validateConfig(rawConfig)) {
          console.warn(chalk.red('Error Initializing'), 'Invalid config file.')
          return
        }

        this.stackFile = this.args.file
        // Check for file changes
        if (filesChanged || this.args.force) {
          if (!this.args.file) {
            console.warn(chalk.red('Error Initializing'), 'Must supply' +
              ' a --file=<stackFile> argument.')
            return
          }
          transpiledStackFile = await this.transpile()
          if (transpiledStackFile) {
            this.stackFile = transpiledStackFile
            // take a new snapshot because file changed.
            await cd.takeSnapshot(cd.defaultSnapshotFilePath)
          }
          if ((await this.areStackFilesValid())) {
            console.info(chalk.cyan('Deploying Stack:'),
              `(via ${chalk.grey(this.stackFile)})`)
            this.deploy()
          }
        } else {
          console.info(chalk.yellow('No file changed after last deploy. Skipping.'))
        }
        break
      case 'undeploy':
        if (!this.args.file) {
          console.warn(chalk.red('Error Initializing'), 'Must supply' +
            ' a --file=<stackFile> argument.')
          return
        }
        this.stackFile = this.args.file
        transpiledStackFile = await this.transpile()
        if (transpiledStackFile) {
          this.stackFile = transpiledStackFile
        }

        if ((await this.areStackFilesValid())) {
          console.info(chalk.cyan('Undeploying Stack:'),
            `(via ${chalk.grey(this.stackFile)})`)
          this.undeploy()
        } else {
          console.info('If you want to undeploy a stack not contained' +
            ' in your local filesystem, please use the AWS console' +
            '  directly.')
        }
        break
      case 'cicd':

        if (!JsonValidation.validateConfig(rawConfig)) {
          console.warn(chalk.red('Error Initializing'), 'Invalid config file.')
          return
        }

        this.deployCi()
        break
      case 'docs':
        this.runDocs()
        break
      case 'clean':
        await this.errorLogger.cleanMessages()
        break
      default:
        this.showHelp()
    }
  }

  /**
   * Shows help for the CDK.
   */
  showHelp (): ParsedArgs {
    return yargs // eslint-disable-line
      .scriptName('npx mira')
      .usage('Usage: npx mira COMMAND')
      .option('profile', { type: 'string', alias: 'p', desc: 'AWS profile name used for AWS CLI' })
      .command('deploy', 'Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
      .command('undeploy', 'Un-Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
      .command('cicd', 'Deploys CI/CD pipeline', yargs => yargs
        .option('file', { type: 'string', aliast: 'f', desc: 'Path to permissions stack file.' })
        .option('envVar', { type: 'string', desc: 'Environment variable passed into the code build' }))
      .command('docs', 'Starts local web server with documentation')
      .command('clean', 'Removes error log files')
      .command('domain', 'Deploys Domain Manager')
      .help()
      .demandCommand()
      .argv
  }

  /**
   * Undeploys a stack.  This calls deploy with the undeploy parameter.  The
   * only reason to do this is that both calls share almost identical code.
   */
  async undeploy (): Promise<void> {
    return await this.deploy(true)
  }

  /**
   * Changes context to use dev config if available, and runs passed function.
   * Typical usecase for this function is to set Dev environment in the context of Mira executable.
   * In case of CDK executions 'dev' is set as NODE_ENV during spawn.
   * @param fn
   * @param params
   */
  useDevConfig<R, Z> (fn: (args: R) => Z, params: [R]): Z {
    const tmpEnv = process.env.NODE_ENV || 'default'
    process.env.NODE_ENV = 'dev'
    const rsp = fn.apply(this, params)
    process.env.NODE_ENV = tmpEnv
    return rsp
  }

  getServiceStackName (account: Account): string {
    const tmpConfig = configModule.util.loadFileConfigs(path.join(process.cwd(), 'config'))
    return `${MiraApp.getBaseStackNameFromParams(tmpConfig.app.prefix, tmpConfig.app.name, 'Service')}-${account.name}`
  }

  getAwsSdkConstruct (construct: string, account: Account): ValidAwsContruct {
    const credentials = new aws.SharedIniFileCredentials({ profile: this.getProfile(this.env) || '' })
    aws.config.credentials = credentials
    // eslint-disable-next-line
    // @ts-ignore
    return new aws[construct]({ region: account.env.region })
  }

  async getFirstFailedNestedStackName (account: Account, stackName: string): Promise<string | undefined> {
    const cloudformation = this.getAwsSdkConstruct('CloudFormation', account)
    const events = await cloudformation.describeStackEvents({ StackName: stackName }).promise()
    return events.StackEvents?.filter((event: StackEvent) => event.ResourceStatus === 'UPDATE_FAILED' || event.ResourceStatus === 'CREATE_FAILED')[0]?.PhysicalResourceId
  }

  async extractNestedStackError (): Promise<StackEvent[]> {
    const account: Account = MiraConfig.getEnvironment(this.env)
    const stackName = this.useDevConfig(this.getServiceStackName, [account])
    // Environment variable required to parse ~/.aws/config file with profiles.
    process.env.AWS_SDK_LOAD_CONFIG = '1'

    let events
    try {
      const nestedStackName = await this.getFirstFailedNestedStackName(account, stackName)
      const cloudformation = this.getAwsSdkConstruct('CloudFormation', account) as CloudFormation
      events = await cloudformation.describeStackEvents({ StackName: nestedStackName }).promise()
    } catch (e) {
      console.log(chalk.red('Error, while getting error message from cloudformation. Seems something is wrong with your configuration.'))
    }
    const output = events?.StackEvents?.filter((event: StackEvent) => event.ResourceStatus === 'UPDATE_FAILED' || event.ResourceStatus === 'CREATE_FAILED')
    return output || []
  }

  filterStackErrorMessages (errors: StackEvent[]): StackEvent[] {
    const output = errors.filter((error) => {
      return error.ResourceStatusReason !== 'Resource creation cancelled'
    })
    return output
  }

  formatNestedStackError (item: StackEvent): string {
    return `\n* ${item.ResourceStatus} - ${item.LogicalResourceId}\nReason: ${item.ResourceStatusReason}\nTime: ${item.Timestamp}\n`
  }

  async printExtractedNestedStackErrors (): Promise<void> {
    const printCarets = (nb: number): string => {
      return '^'.repeat(nb)
    }
    const failedResources = await this.extractNestedStackError()
    if (Array.isArray(failedResources)) {
      console.log(chalk.red('\n\nYour app failed deploying, one of your nested stacks have failed to create or update resources. See the list of failed resources below:'))
      const filteredMessages = this.filterStackErrorMessages(failedResources)
      filteredMessages.map((errorMessage) => {
        console.log(chalk.red(this.formatNestedStackError(errorMessage)))
      })
      this.errorLogger.flushMessages(filteredMessages.map(m => this.formatNestedStackError(m)))

      console.log(chalk.red(`\n\n${printCarets(100)}\nAnalyze the list above, to find why your stack failed deployment.`))
    }
  }

  async transpile (): Promise<string | undefined> {
    if (this.stackFile.match(/.ts$/)) {
      const T = new Transpiler(this.stackFile)
      const newFile = await T.run()
      return newFile
    }
  }
}
