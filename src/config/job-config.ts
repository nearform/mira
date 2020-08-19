import { userInfo } from 'os'
import { pascalCase } from 'change-case'
import config from 'config'
import { EnvData, RoleConfig, nameResource, loadAWSProfile, getUrl, loadEnvironment } from './utils'

interface NetworkConfig {
  readonly withDomain: boolean
  readonly baseDomain?: string // Developer mode only
  readonly webAppUrl?: string // Non-developer mode only
  readonly parameterPrefix: string
  readonly vpcId?: string // aka existingVpc, FIXME: wire in when revisiting consumers
}

interface RepoConfig {
  readonly provider: string
  readonly name: string
  readonly url: string
  readonly branch: string
  readonly gitHubTokenSecretArn?: string
  readonly codeCommitUserPublicKey?: string
}

/** @ignore - Excluded from documentation generation. */
enum Deployment {
  CICD = 'CICD',
  DomainManager = 'DomainManager',
  Application = 'Application'
}

export interface ApplicationDetails {
  readonly stackName: string
  readonly isDeveloperMode: boolean
  readonly role: RoleConfig
  readonly network: NetworkConfig
  readonly requireManualApproval: boolean
}
export interface CICDDetails {
  readonly stackName: string
  readonly role: RoleConfig
  readonly repo: RepoConfig
  readonly buildspecFilename: string
  readonly steps: ApplicationDetails[]
}
export interface DomainManagerDetails {
  readonly stackName: string
  readonly role: RoleConfig
  readonly hostedZoneId: string
}

/**
 * Stores all the required data for one self-contained deployment job
 */
export default class MiraConfig {
  public readonly deployment: Deployment
  public readonly environment: string
  public readonly target: string
  public readonly details: CICDDetails | DomainManagerDetails | ApplicationDetails

  constructor (deploymentCmd = 'deploy', environment?: string) {
    switch (deploymentCmd) {
      case 'deploy':
        this.deployment = Deployment.Application
        if (!environment) {
          throw new Error('Cannot deploy environment undefined')
        }
        this.environment = environment
        break
      case 'cicd':
        this.deployment = Deployment.CICD
        this.environment = 'Global'
        break
      case 'domain':
        this.deployment = Deployment.DomainManager
        this.environment = 'Global'
        break
      default:
        throw new Error('Cannot resolve deployment type')
    }
    const appPrefix: string = config.get('app.prefix')
    const appName = pascalCase(config.get('app.name'))
    this.target = nameResource(appPrefix, appName)
    const deploymentSuffix = this.environment !== 'Global' ? this.environment : this.deployment
    const deploymentStackName = nameResource(appPrefix, appName, deploymentSuffix)

    const massageEnvData = (envData: EnvData, isDeveloperMode: boolean): ApplicationDetails => {
      const environmentSuffix = isDeveloperMode ? pascalCase(userInfo().username) : envData.name
      const environmentStackName = nameResource(appPrefix, appName, environmentSuffix)
      return {
        stackName: environmentStackName,
        isDeveloperMode,
        role: loadAWSProfile(envData.profile),
        network: {
          withDomain: !!envData.withDomain,
          ...getUrl(envData, isDeveloperMode, environmentStackName),
          parameterPrefix: `/${appPrefix}/${appName}/${environmentSuffix}`.toLowerCase()
        },
        requireManualApproval: !!envData.requireManualApproval
      }
    }

    switch (this.deployment) {
      case Deployment.CICD: {
        for (const key of ['cicd', 'cicd.repository_url', 'cicd.branch_name', 'cicd.buildspec_file', 'cicd.steps']) {
          let value = config.get(key)
          if (typeof value === 'string') value = value.trim()
          if (!value) {
            throw new Error('Missing config.' + key)
          }
        }
        const repo: RepoConfig = {
          name: nameResource(appPrefix, appName, 'Repository'),
          provider: config.get('cicd.source'),
          url: config.get('cicd.repository_url'),
          branch: config.get('cicd.branch_name'),
          gitHubTokenSecretArn: config.get('cicd.github_token_secret_arn'),
          codeCommitUserPublicKey: config.get('cicd.codecommit_public_key')
        }
        // Check repository provider
        switch (repo.provider) {
          case 'github':
            if (!(repo.gitHubTokenSecretArn || '').trim()) {
              throw new Error('Missing config.cicd.github_token_secret_arn')
            }
            break
          case 'codecommit':
            if (!(repo.codeCommitUserPublicKey || '').trim()) {
              throw new Error('Missing config.cicd.codecommit_public_key')
            }
            break
          default:
            throw new Error('Could not determine repository provider')
        }

        const stepKeys: string[] = config.get('cicd.steps') || []
        const steps: ApplicationDetails[] = stepKeys.map((envKey: string) => {
          const envData: EnvData = loadEnvironment(envKey)
          return massageEnvData(envData, false)
        })
        const details: CICDDetails = {
          stackName: deploymentStackName,
          role: loadAWSProfile(config.get('cicd.profile')),
          repo,
          buildspecFilename: config.get('cicd.buildspec_file'),
          steps
        }
        this.details = details
        break
      }
      case Deployment.Application: {
        const isDeveloperMode = this.environment === 'Developer'
        const envData: EnvData = loadEnvironment(this.environment)
        this.details = massageEnvData(envData, isDeveloperMode)
        break
      }
      case Deployment.DomainManager: {
        const envData: EnvData = config.get('domain')
        if (!envData) {
          throw new Error('Missing config.domain')
        }
        if (!envData.hostedZoneId) {
          throw new Error('Missing config.domain.hostedZoneId')
        }
        const details: DomainManagerDetails = {
          stackName: deploymentStackName,
          role: loadAWSProfile(config.get('cicd.profile')),
          hostedZoneId: envData.hostedZoneId
        }
        this.details = details
        break
      }
    }
  }
}
