import path from 'path'
import chalk from 'chalk'
import { ParsedArgs } from 'minimist'
import { spawn } from 'child_process'
import { MiraApp } from './app'
import { Account, MiraConfig } from '../config/mira-config'
import configWizard from './constructs/config/make-default-config'
import { assumeRole } from '../assume-role'
import yargs from 'yargs'
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
  docsifyCommand: string;

  constructor () {
    this.cdkCommand = path.join(require.resolve('aws-cdk'), '..', '..', 'bin', 'cdk')
    this.docsifyCommand = path.join(require.resolve('docsify-cli'), '..', '..', 'bin', 'docsify')

    this.app = new MiraApp()
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
      '--app', this.getCDKArgs('app.js'),
      envConfig.name ? `--env=${envConfig.name}` : '',
      this.env ? `--profile=${this.getProfile(this.env)}` : '',
      ...additionalArgs
    ]
    try {
      this.spawn(
        'node',
        commandOptions, {
          stdio: 'inherit',
          env: {
            NODE_ENV: 'dev',
            ...process.env
          }
        })
    } catch (error) {
      console.error(error.message)
      process.exit(1)
    }
  }

  /**
   * Orchestration for `npx mira cicd` command. As an effect, CodePipeline and related services will be deployed together
   * with permission stacks deployed to the target accounts.
   */
  async deployCi () {
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
    const appPath = path.resolve(__dirname, filename)
    let appArg = `${q}node "${appPath}" `
    // Still inside the quotes, explode the args.
    appArg += this.getArgs().join(' ')
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
  getProfile (environment: string): string|void {
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
    for (const stackName of MiraApp.getStackFiles()) {
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

    const cmd = this.args._[0]
    let stackFile: string
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
        stackFile = this.args.file

        if ((await this.areStackFilesValid())) {
          console.info(chalk.cyan('Deploying Stack:'),
            `(via ${chalk.grey(stackFile)})`)
          this.deploy()
        }
        break
      case 'undeploy':
        stackFile = this.args.file

        if ((await this.areStackFilesValid())) {
          console.info(chalk.cyan('Undeploying Stack:'),
            `(via ${chalk.grey(stackFile)})`)
          this.undeploy()
        } else {
          console.info('If you want to undeploy a stack not contained' +
            ' in your local filesystem, please use the AWS console' +
            '  directly.')
        }
        break
      case 'cicd':
        this.deployCi()
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
      .option('profile', { type: 'string', alias: 'p', desc: 'AWS profile name used for AWS CLI' })
      .command('deploy', 'Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
      .command('undeploy', 'Un-Deploys given stack', yargs => yargs
        .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
      .command('cicd', 'Deploys CI/CD pipeline', yargs => yargs
        .option('file', { type: 'string', aliast: 'f', desc: 'Path to permissions stack file.' })
        .option('envVar', { type: 'string', desc: 'Environment variable passed into the code build' }))
      .command('docs', 'Starts local web server with documentation')
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
}
