import configModule from 'config'
import { pascalCase } from 'change-case'
import parseGitUrl from 'git-url-parse'

// eslint-disable-next-line
const minimist = require('minimist')

const args = minimist(process.argv)

export interface AccountEnvData {
  account: string
  region: string
}

type EnvironmentVariable = {
  name: string
  value: string
}

export interface Account {
  readonly name: string
  readonly profile?: string
  readonly env: AccountEnvData
}

export interface Stage {
  readonly target: string
  readonly withDomain?: boolean
  readonly requireManualApproval: boolean
}

export interface CiProps {
  readonly target: string
  readonly withDomain?: string
  readonly requireManualApproval?: boolean
  readonly account: Account
}

interface CicdConfig {
  readonly account: Account
  readonly permissionsFile: string
  readonly provider: string
  readonly repositoryUrl: string
  readonly branchName: string
  readonly gitHubTokenSecretArn?: string
  readonly codeCommitUserPublicKey?: string
  readonly buildspecFile: string
  readonly accounts: string[]
  readonly repositoryOwner: string
  readonly repositoryName: string
}

interface DomainConfig {
  readonly hostedZoneId: string
  readonly accounts: string[]
}

enum CONFIG_KEYS {
  CICD = 'cicd',
  ACCOUNTS = 'accounts',
  DEV = 'dev',
  STAGES = 'stages',
  TARGET = 'target'
}

const whitelistedArgs: string[] = ['docs', 'init']

class MiraConfigClass {
  public readonly projectName: string
  public readonly projectPrefix: string

  constructor () {
    try {
      this.projectName = pascalCase(configModule.get('app.name'))
      this.projectPrefix = pascalCase(configModule.get('app.prefix'))
    } catch (err) {
      if (!whitelistedArgs.includes(args._[2])) {
        console.warn(`${err.message}, you will not be able to deploy your app yet. `)
        throw err
      }
    }
  }

  public defaultEnvironmentName: string

  public setDefaultEnvironmentName (name: string): void {
    this.defaultEnvironmentName = name
  }

  public getEnvironment (name?: string): Account {
    name = this.getTargetName(name)
    const output = this.getFullAccountProps(name)
    if (!output) {
      throw new Error(`Cannot find environment ${name}`)
    }
    return output
  }

  public getEnvironmentWithCiProps (name?: string): CiProps {
    name = this.getTargetName(name)
    const output = this.getFullAccountProps(name)
    if (!output) {
      throw new Error(`Cannot find environment ${name}`)
    }
    const cicdKey = `${CONFIG_KEYS.CICD}.${CONFIG_KEYS.STAGES}`
    const ciOutput = (configModule
      .get(cicdKey) as CiProps[])
      .find((ciProps: CiProps) => ciProps.target === name)
    if (!output) {
      throw new Error(`Cannot find environment ${name}`)
    }
    return Object.assign({}, { account: output }, ciOutput)
  }

  public getBaseStackName (suffix = ''): string {
    let output = `${this.projectPrefix}-${this.projectName}`
    if (suffix) {
      output += `-${suffix}`
    }
    return output
  }

  public calculateCertificateStackName (): string {
    return this.getBaseStackName('Domain')
  }

  public calculateRepositoryName (): string {
    return this.getBaseStackName('Repository')
  }

  public getCICDAccounts (): Account[] {
    let output = [] as Account[]
    const accountsPath = `${CONFIG_KEYS.CICD}.${CONFIG_KEYS.STAGES}`
    if (configModule.has(accountsPath)) {
      output = ((configModule.get(accountsPath) || []) as Stage[])
        .map((stage: Stage) => this.getEnvironment(stage.target))
    }
    return output
  }

  public getPermissionsFilePath (): string {
    return args.file || args.f || this.getCICDConfig().permissionsFile
  }

  public getCICDConfig (): CicdConfig {
    const output = this.getFullCiProps(CONFIG_KEYS.CICD)
    const {
      name,
      owner
    } = parseGitUrl(output.repositoryUrl)
    return {
      ...output,
      repositoryName: name,
      repositoryOwner: owner
    }
  }

  public getDomainConfig (): DomainConfig {
    if (configModule.has('domain')) {
      return configModule.get('domain') as DomainConfig
    }
    throw new Error('Cannot find Domain configuration.')
  }

  public getDomainAllowedPrincipals (): Account[] {
    let output = [] as Account[]
    if (configModule.has('domain.accounts')) {
      output = ((configModule.get('domain.accounts') || []) as string[])
        .map((accountName) => this.getEnvironment(accountName))
    }
    return output
  }

  public calculateSharedResourceName (resource: string): string {
    const env = this.getEnvironment()
    const prefix = this.getBaseStackName()
    return `${prefix}-${env.name}-${resource}`
  }

  private getFullCiProps (name: string): CicdConfig {
    if (!configModule.has(name)) throw new Error(`Missing ${name} in the top level of config.`)
    if (!configModule.has(`${name}.${CONFIG_KEYS.TARGET}`)) throw new Error(`Missing ${CONFIG_KEYS.TARGET} name in the ${name} configuration.`)
    const envKey: string = configModule.get(`${name}.${CONFIG_KEYS.TARGET}`)
    if (!configModule.has(`${CONFIG_KEYS.ACCOUNTS}.${envKey}`)) {
      throw new Error(`Target named: ${envKey} is not defined in the accounts section of the configuration file. Check if you did not override accounts in dev.json file.`)
    }
    const account: Account = configModule.get(`${CONFIG_KEYS.ACCOUNTS}.${envKey}`)
    return Object.assign({}, configModule.get(name), { account }) as CicdConfig
  }

  private getFullAccountProps (name: string): Account {
    const accountsKey = CONFIG_KEYS.ACCOUNTS
    if (!configModule.has(accountsKey)) throw new Error(`Missing ${accountsKey} section in your configuration file`)
    if (!configModule.has(`${accountsKey}.${name}`)) throw new Error(`Missing ${accountsKey}.${name} section in your configuration file`)
    return Object.assign({}, configModule.get(`${accountsKey}.${name}`), { name }) as Account
  }

  private getTargetName (name?: string): string {
    const devTargetPath = `${CONFIG_KEYS.DEV}.${CONFIG_KEYS.TARGET}`
    if (!name) {
      if (!configModule.has(devTargetPath)) {
        throw new Error(`Missing ${devTargetPath} in your config file.`)
      }
      name = configModule.get(devTargetPath) || ''
    }
    return name
  }
}

export const MiraConfig = new MiraConfigClass()
