import configModule from 'config'
import { pascalCase } from 'change-case'
import parseGitUrl from 'git-url-parse'

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
  readonly profile: string
  readonly env: AccountEnvData
  readonly withDomain?: boolean
  readonly baseDomain?: string
  readonly webAppUrl?: string
  readonly requireManualApproval?: boolean
  readonly hostedZoneId?: 'string'
}

interface CicdConfig {
  readonly account: string
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

class MiraConfigClass {
  public readonly projectName: string
  public readonly projectPrefix: string

  constructor () {
    this.projectName = pascalCase(configModule.get('app.name'))
    this.projectPrefix = pascalCase(configModule.get('app.prefix'))
  }

  public defaultEnvironmentName: string

  public setDefaultEnvironmentName (name: string): void {
    this.defaultEnvironmentName = name
  }

  public getEnvironment (name?: string): Account {
    if (!name) {
      name = this.defaultEnvironmentName
    }
    const key = 'accounts'
    if (configModule.has(key)) {
      const output = (configModule
        .get(key) as Account[])
        .find((account: Account) => account.name === name)
      if (!output) {
        throw new Error(`Cannot find environment ${name}`)
      }
      return output
    }
    throw new Error(`Cannot find environment ${name}`)
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
    if (configModule.has('cicd.accounts')) {
      output = ((configModule.get('cicd.accounts') || []) as string[])
        .map((accountName) => this.getEnvironment(accountName))
    }
    return output
  }

  public getCICDConfig (): CicdConfig {
    if (configModule.has('cicd')) {
      const output = configModule.get('cicd') as CicdConfig
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
    throw new Error('Cannot find CICD configuration.')
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
}

export const MiraConfig = new MiraConfigClass()
