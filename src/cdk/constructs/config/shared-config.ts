import { pascalCase } from 'change-case'
import { execFileSync } from 'child_process'
import { join as joinPathParts } from 'path'
import { Construct } from '@aws-cdk/core'
import parseGitUrl from 'git-url-parse'
import { MiraConfig } from '../../../config/mira-config'

interface Env {
  readonly account?: string
  readonly region?: string
}

interface Repository {
  readonly repositoryName: string
  readonly repositoryOwner: string
}

const getDefaultEnv = (): Env => {
  const account = MiraConfig.getEnvironment()
  return account.env
}

let ctxCache: any

export abstract class SharedConfig {
  public readonly env: Env
  public readonly projectName: string
  public readonly projectOwner: string
  protected readonly scope?: Construct

  constructor (scope?: Construct) {
    this.env = getDefaultEnv()
    this.scope = scope
    this.projectName = MiraConfig.projectName
    this.projectOwner = MiraConfig.projectPrefix
  }

  protected getContext (name: string): Partial<SharedConfig> | undefined {
    if (this.scope) {
      return this.scope.node.tryGetContext(name)
    } else {
      return this.loadContextFromCli(name)
    }
  }

  private loadContextFromCli (section: string): Partial<SharedConfig> {
    if (!ctxCache) {
      // An investigation was done to check if a direct access to the `cdk.json` file
      // could suffice to load the context. We are already loading the context from 2 different places:
      // the `cdk.json` and the `cdk.context.json` file (if exists) then building a logic to manage it
      // will cause an additional complexity.
      //
      // The documentation about the context can be found here:
      // https://docs.aws.amazon.com/cdk/latest/guide/context.html
      if (process.platform === 'win32') {
        ctxCache = execFileSync('cdk.cmd', ['context', '--json'], {
          cwd: joinPathParts(__dirname, '../..')
        })
      } else {
        ctxCache = execFileSync('cdk', ['context', '--json'], {
          cwd: process.cwd()
        })
      }
    }

    const parsed = JSON.parse(ctxCache.toString())
    return parsed[section]
  }

  private static getProjectName (): string {
    const { repositoryName } = SharedConfig.parseRepository()
    return pascalCase(repositoryName)
  }

  protected static getProjectOwner (): string {
    const { repositoryOwner } = SharedConfig.parseRepository()
    return pascalCase(repositoryOwner)
  }

  public getBaseProject (): string {
    return `${this.projectOwner}-${this.projectName}`
  }

  public static calculateSharedResourceName (environment: string, resource: string): string {
    const projectName = this.getProjectName()
    return `${projectName}-${environment}-${resource}`
  }

  protected static parseRepository (): Repository {
    const {
      name: repositoryName,
      owner: repositoryOwner
    } = parseGitUrl(MiraConfig.getCICDConfig().repositoryUrl)

    return { repositoryName, repositoryOwner }
  }

  public static getTestEnv (): Env {
    return {
      account: '735773577357',
      region: 'test-west-3000'
    }
  }
}
