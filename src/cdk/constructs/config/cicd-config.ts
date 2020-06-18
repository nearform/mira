import { Construct } from '@aws-cdk/core'
import { SharedConfig } from './shared-config'
import config from 'config'
import parseGitUrl from 'git-url-parse'

export type EnvironmentVariable = {
  name: string
  value: string
}
export class CicdConfig extends SharedConfig {
  public readonly branchName: string = 'master'
  public readonly enabled: boolean = true
  public readonly profile: string
  public readonly gitHubTokenSecretArn?: string
  public readonly codeCommitUserPublicKey?: string
  public readonly repositoryProvider: string
  public readonly repositoryName: string
  public readonly repositoryOwner: string
  public readonly repositoryUrl: string
  public readonly buildspecFilename: string
  public readonly accounts = [] as any

  constructor (scope?: Construct) {
    super(scope)
    this.repositoryName = this.projectName
    this.repositoryOwner = this.projectOwner
    if (!config.get('cicd')) {
      throw new Error('No "cicd" section in config file.')
    }
    // Parse config
    this.repositoryProvider = config.get('cicd.source')
    this.profile = config.get('profile')
    this.gitHubTokenSecretArn = config.get('cicd.github_token_secret_arn')
    this.codeCommitUserPublicKey = config.get('cicd.codecommit_public_key')
    this.branchName = config.get('cicd.branch_name')
    this.accounts = config.get('cicd.accounts')
    this.repositoryUrl = config.get('cicd.repository_url')
    this.buildspecFilename = config.get('cicd.buildspec_file')

    // Parse repository url
    const parsed = parseGitUrl(this.repositoryUrl)
    this.repositoryOwner = parsed.owner
    this.repositoryName = parsed.name

    // Check repository provider
    switch (this.repositoryProvider) {
      case 'github':
        if (!this.gitHubTokenSecretArn) {
          throw new Error('github_token_secret_arn must be provided in cicd configuragion.')
        }
        break
      case 'codecommit':
        if (!this.codeCommitUserPublicKey) {
          throw new Error('codecommit_public_key must be provided in cicd configuragion.')
        }
        break
      default:
        throw new Error('Could not determine repository provider.')
    }

    if (!this.profile) {
      throw new Error('profile was not provided for Cicd')
    }
  }

  /**
   * Gets the stack name, given the project owner and project name as defined
   * by the instance of this class.
   */
  public calculateStackName (): string {
    return `${this.projectOwner}-${this.projectName}-Cicd`
  }

  public calculateRepositoryName (): string {
    return `${this.projectOwner}-${this.projectName}-Repository`
  }

  public static getTestContext (): Partial<CicdConfig> {
    return {
      env: super.getTestEnv()
    }
  }

  public getAccountDetails (name: string) {
    for (let index = 0; index < this.accounts.length; index++) {
      const account = this.accounts[index]
      if (account.name! === name) {
        return account
      }
    }
    return null
  }

  public getEnvironmentVariables (): Array<EnvironmentVariable> {
    let output = [] as EnvironmentVariable[]
    const vars = config.get('cicd.environmentVariables') as EnvironmentVariable[]
    if (vars) {
      output = vars
    }
    return output
  }
}
