import path from 'path'
import chalk from 'chalk'
import { ParsedArgs } from 'minimist'
import { execFileSync } from 'child_process'
import { MiraApp } from './app'
import { MiraConfig } from '../config/mira-config'
import configWizard from './constructs/config/make-default-config'
import { assumeRole } from '../assume-role'
import yargs from 'yargs'
/**
 * @class Responsible for beaming up bits to AWS.  Teleportation device not
 * included.
 */
export class MiraBootstrap {
  app: MiraApp;
  execFileSync: typeof execFileSync;
  args: ParsedArgs;
  env: string;
  cdkCommand: string;
  docsifyCommand: string;

  constructor () {
    this.cdkCommand = path.join(require.resolve('aws-cdk'), '..', '..', 'bin', 'cdk')
    this.docsifyCommand = path.join(require.resolve('docsify-cli'), '..', '..', 'bin', 'docsify')

    this.app = new MiraApp()
    this.execFileSync = execFileSync
    // this.args = minimist(process.argv.slice(2))
    this.args = this.showHelp()
    this.env = this.args.env || 'Default'
    MiraConfig.setDefaultEnvironmentName(this.env)
    if (Object.keys(this.args).includes('env')) {
      delete this.args.env
    }
  }

  async deploy (stack: string, undeploy = false): Promise<void> {
    const envConfig = MiraConfig.getEnvironment(this.env)
    if (this.args.role) {
      await assumeRole(this.args.role)
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
      this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
      cmd,
      '--app', this.getCDKArgs(stack, 'app.js'),
      `--env=${envConfig.name}`,
      `--profile=${this.getProfile(this.env)}`,
      ...additionalArgs
    ]
    try {
      this.execFileSync(
        'node',
        commandOptions, {
          stdio: 'inherit',
          env: {
            ...process.env
          }
        })
    } catch (error) {
      console.error(error.message)
      process.exit(1)
    }
  }

  deployCi (stack: string): void {
    const envConfig = MiraConfig.getEnvironment(this.env)
    let cmd = 'deploy'
    if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
      cmd = 'synth'
    }

    const commandOptions = [
      this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
      cmd,
      '--app', this.getCDKArgs(stack, 'ci-app.js'),
      `--env=${envConfig.name}`,
      `--profile=${this.getProfile(this.env)}`
    ]
    try {
      this.execFileSync(
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

  runDocs (): void {
    const commandOptions = [
      this.docsifyCommand + (process.platform === 'win32' ? '.cmd' : ''),
      'serve',
      path.join(__dirname, '..', '..', '..', 'docs')
    ]
    try {
      this.execFileSync(
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

  deployDomain (stack: string): void {
    const envConfig = MiraConfig.getEnvironment(this.env)
    let cmd = 'deploy'
    if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
      cmd = 'synth'
    }

    const commandOptions = [
      this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
      cmd,
      '--app', this.getCDKArgs(stack, 'domain.js'),
      `--env=${envConfig.name}`,
      `--profile=${this.getProfile(this.env)}`
    ]
    try {
      this.execFileSync(
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

  getCDKArgs (stack: string, filename: string): string {
    const q = process.platform === 'win32' ? '"' : '\''
    const appPath = path.resolve(__dirname, filename)
    let appArg = `${q}node "${appPath}" --stack=${stack} `
    // Still inside the quotes, explode the args.
    appArg += this.getArgs().join(' ')
    appArg += ` --env=${this.env}`
    appArg += q // End quote.
    return appArg
  }

  /**
   * Gets the arguments for this stack.
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
  getProfile (environment: string): string|void {
    // if we are in Codebuild environment, return 'client' which is the one set by assume-role
    if (process.env.CODEBUILD_CI) {
      return 'client'
    }
    const envConfig = MiraConfig.getEnvironment(environment)
    if (envConfig) {
      return envConfig.profile
    }
  }

  async areStackFilesValid (): Promise<boolean> {
    let isValid = true
    for (const stackName of MiraApp.getStackFiles()) {
      if (!(await this.app.getStack(stackName))) {
        console.warn(chalk.yellow('Stack Not Found:'), stackName)
        isValid = false
      }
    }
    return isValid
  }

  async initialize (): Promise<void> {
    const cmd = this.args._[0]
    let stackFile: string
    let stackName: string
    switch (cmd) {
      case 'domain':
        stackName = this.args._[1]
        this.deployDomain(stackName)
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
        stackFile = this.args.file
        stackName = this.args.stack_name

        if ((await this.areStackFilesValid())) {
          console.info(chalk.cyan('Deploying Stack:'), stackName,
            `(via ${chalk.grey(stackFile)})`)
          this.deploy(stackName)
        }
        break
      case 'undeploy':
        stackFile = this.args.file
        stackName = this.args.stack_name

        if ((await this.areStackFilesValid())) {
          console.info(chalk.cyan('Deploying Stack:'), stackName,
            `(via ${chalk.grey(stackFile)})`)
          this.undeploy(stackName)
        } else {
          console.info('If you want to undeploy a stack not contained' +
            ' in your local filesystem, please use the AWS console' +
            '  directly.')
        }
        break
      case 'cicd':
        stackName = this.args.stack_name
        this.deployCi(stackName)
        break
      case 'docs':
        this.runDocs()
        break
      default:
        this.showHelp()
    }
  }

  /**
   * Shows help for the CDK.
   */
  showHelp (): any {
    return yargs // eslint-disable-line
      .scriptName('npx mira')
      .usage('Usage: npx mira COMMAND')
      .option('profile', { type: 'string', alias: 'p', desc: 'REQUIRED: AWS profile name used to for AWS CLI', requiresArg: true })
      .command('deploy [STACK_NAME..]', 'Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
      .command('undeploy [STACK_NAME..]', 'REQUIRED: Un-Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'Path to your stack file', requiresArg: true }))
      .command('cicd [STACK_NAME]', 'Un-Deploys given stack', yargs => yargs
        .option('envVar', { type: 'string', desc: 'Environment variable passed into the code build' }))
      .help()
      .demandCommand()
      .argv
  }

  /**
   * Undeploys a stack.  This calls deploy with the undeploy parameter.  The
   * only reason to do this is that both calls share almost identical code.
   * @param stack
   */
  async undeploy (stack: string): Promise<void> {
    return await this.deploy(stack, true)
  }
}
