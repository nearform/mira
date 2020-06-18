import _ from 'lodash'
import healthyConfig from './__mocks__/healthy-config.json'
import config from 'config'

import MiraJobConfig, { ApplicationDetails } from './job-config'

jest.mock('config')
jest.mock('os', (): object => ({ userInfo: (): object => ({ username: 'BobPC' }) }))

interface Profiles {
  [key: string]: object
}
const profiles: Profiles = {
  'company-dev': { credentials: { roleArn: 'arn:aws:iam::111111111111:role/CompanyDev-AdminAccess' }, region: 'eu-west-1' },
  'company-prd': { credentials: { roleArn: 'arn:aws:iam::222222222222:role/CompanyProd-AdminAccess' }, region: 'eu-west-1' },
  'company-domain': { credentials: { roleArn: 'arn:aws:iam::333333333333:role/CompanyDomain-AdminAccess' }, region: 'eu-west-1' }
}

jest.mock('aws-sdk', () => ({
  SharedIniFileCredentials: jest.fn(),
  Config: jest.fn().mockImplementation(() => {
    const profile: string = process.env.AWS_PROFILE || ''
    return _.cloneDeep(profiles[profile])
  })
}))

const mockConfigHandler = (mockConfig: any): void => {
  config.get = (key: string): any => _.get(mockConfig, key)
  config.has = (key: string): any => _.has(mockConfig, key)
}

interface TestEnvData {
  profile?: string
  withDomain?: boolean
  baseDomain?: string
  webAppUrl?: string
  requireManualApproval?: boolean
  hostedZoneId?: 'string'
}

describe('MiraJobConfig', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Healthy input', () => {
    it('Handles {environment} deployment', () => {
      let jobConfig
      mockConfigHandler(healthyConfig)
      jobConfig = new MiraJobConfig('deploy', 'Staging')
      expect(jobConfig).toEqual({
        deployment: 'Application',
        environment: 'Staging',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-Staging',
          isDeveloperMode: false,
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          network: {
            withDomain: true,
            baseDomain: 'company.com',
            webAppUrl: 'staging.company.com',
            parameterPrefix: '/company/product/staging'
          },
          requireManualApproval: false
        }
      })

      jobConfig = new MiraJobConfig('deploy', 'Production')
      expect(jobConfig).toEqual({
        deployment: 'Application',
        environment: 'Production',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-Production',
          isDeveloperMode: false,
          role: {
            profile: 'company-prd',
            account: '222222222222',
            region: 'eu-west-1'
          },
          network: {
            withDomain: true,
            baseDomain: 'company.com',
            webAppUrl: 'company.com',
            parameterPrefix: '/company/product/production'
          },
          requireManualApproval: true
        }
      })
    })

    it('Handles Developer deployment', () => {
      mockConfigHandler(healthyConfig)
      let jobConfig
      jobConfig = new MiraJobConfig('deploy', 'Developer')
      expect(jobConfig).toEqual({
        deployment: 'Application',
        environment: 'Developer',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-BobPc',
          isDeveloperMode: true,
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          network: {
            withDomain: true,
            baseDomain: 'company.com',
            webAppUrl: 'company-product-bobpc.company.com',
            parameterPrefix: '/company/product/bobpc'
          },
          requireManualApproval: false
        }
      })

      const webAppUrlConfig = _.cloneDeep(healthyConfig)
      delete webAppUrlConfig.environments.Developer.baseDomain;
      (webAppUrlConfig.environments.Developer as TestEnvData).webAppUrl = 'custom.company.com'
      mockConfigHandler(webAppUrlConfig)
      jobConfig = new MiraJobConfig('deploy', 'Developer')
      expect(jobConfig).toEqual({
        deployment: 'Application',
        environment: 'Developer',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-BobPc',
          isDeveloperMode: true,
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          network: {
            withDomain: true,
            baseDomain: 'company.com',
            webAppUrl: 'custom.company.com',
            parameterPrefix: '/company/product/bobpc'
          },
          requireManualApproval: false
        }
      })
    })

    it('Handles CICD deployment', () => {
      mockConfigHandler(healthyConfig)
      let jobConfig
      jobConfig = new MiraJobConfig('cicd')
      expect(jobConfig).toEqual({
        deployment: 'CICD',
        environment: 'Global',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-Cicd',
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          repo: {
            name: 'Company-Product-Repository',
            provider: 'github',
            url: 'https://github.com/company/product',
            branch: 'master',
            gitHubTokenSecretArn: 'arn:aws:secretsmanager:eu-west-1:111111111111:secret:GitHubToken-VqjNoC',
            codeCommitUserPublicKey: ''
          },
          buildspecFilename: 'infra/buildspec.yaml',
          steps: [
            {
              stackName: 'Company-Product-Staging',
              isDeveloperMode: false,
              role: {
                profile: 'company-dev',
                account: '111111111111',
                region: 'eu-west-1'
              },
              network: {
                withDomain: true,
                baseDomain: 'company.com',
                webAppUrl: 'staging.company.com',
                parameterPrefix: '/company/product/staging'
              },
              requireManualApproval: false
            },
            {
              stackName: 'Company-Product-Production',
              isDeveloperMode: false,
              role: {
                profile: 'company-prd',
                account: '222222222222',
                region: 'eu-west-1'
              },
              network: {
                withDomain: true,
                baseDomain: 'company.com',
                webAppUrl: 'company.com',
                parameterPrefix: '/company/product/production'
              },
              requireManualApproval: true
            }
          ]
        }
      })

      const codeCommitConfig = _.cloneDeep(healthyConfig)
      codeCommitConfig.cicd.source = 'codecommit'
      const githubKey = 'github_token_secret_arn'
      const codeCommitKey = 'codecommit_public_key'
      codeCommitConfig.cicd[githubKey] = ''
      codeCommitConfig.cicd[codeCommitKey] = 'foo'
      mockConfigHandler(codeCommitConfig)
      jobConfig = new MiraJobConfig('cicd')
      expect(jobConfig).toEqual({
        deployment: 'CICD',
        environment: 'Global',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-Cicd',
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          repo: {
            name: 'Company-Product-Repository',
            provider: 'codecommit',
            url: 'https://github.com/company/product',
            branch: 'master',
            gitHubTokenSecretArn: '',
            codeCommitUserPublicKey: 'foo'
          },
          buildspecFilename: 'infra/buildspec.yaml',
          steps: [
            {
              stackName: 'Company-Product-Staging',
              isDeveloperMode: false,
              role: {
                profile: 'company-dev',
                account: '111111111111',
                region: 'eu-west-1'
              },
              network: {
                withDomain: true,
                baseDomain: 'company.com',
                webAppUrl: 'staging.company.com',
                parameterPrefix: '/company/product/staging'
              },
              requireManualApproval: false
            },
            {
              stackName: 'Company-Product-Production',
              isDeveloperMode: false,
              role: {
                profile: 'company-prd',
                account: '222222222222',
                region: 'eu-west-1'
              },
              network: {
                withDomain: true,
                baseDomain: 'company.com',
                webAppUrl: 'company.com',
                parameterPrefix: '/company/product/production'
              },
              requireManualApproval: true
            }
          ]
        }
      })
    })

    it('Handles DomainManager deployment', () => {
      mockConfigHandler(healthyConfig)
      const jobConfig = new MiraJobConfig('domain')
      expect(jobConfig).toEqual({
        deployment: 'DomainManager',
        environment: 'Global',
        target: 'Company-Product',
        details: {
          stackName: 'Company-Product-DomainManager',
          role: {
            profile: 'company-dev',
            account: '111111111111',
            region: 'eu-west-1'
          },
          hostedZoneId: 'Z2DHU1GXEKO5Q6'
        }
      })
    })
  })

  describe('Corrupt input', () => {
    it('Handles {environment} deployment', () => {
      mockConfigHandler(healthyConfig)
      expect(() => new MiraJobConfig('deploy')).toThrowError('Cannot deploy environment undefined')

      let brokenConfig

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Staging')).toThrowError('Missing config.environments')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Staging
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Staging')).toThrowError('Cannot find config for environment Staging')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Staging.profile
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Staging')).toThrowError('AWS profile undefined is missing role_arn or region information')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Staging.withDomain
      mockConfigHandler(brokenConfig)
      expect(((new MiraJobConfig('deploy', 'Staging')).details as ApplicationDetails).network.withDomain).toEqual(false)

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Staging.webAppUrl
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Staging')).toThrowError('No webAppUrl set for Staging')

      brokenConfig = _.cloneDeep(healthyConfig);
      (brokenConfig.environments.Staging as TestEnvData).baseDomain = 'company.com'
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Staging')).toThrowError('Cannot specify baseDomain when already given webAppUrl for Staging')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Staging.requireManualApproval
      mockConfigHandler(brokenConfig)
      expect(((new MiraJobConfig('deploy', 'Staging')).details as ApplicationDetails).requireManualApproval).toEqual(false)
    })

    it('Handles Developer deployment', () => {
      let brokenConfig

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Developer')).toThrowError('Missing config.environments')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Developer
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Developer')).toThrowError('Cannot find config for environment Developer')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Developer.profile
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Developer')).toThrowError('AWS profile undefined is missing role_arn or region information')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Developer.withDomain
      mockConfigHandler(brokenConfig)
      expect(((new MiraJobConfig('deploy', 'Developer')).details as ApplicationDetails).network.withDomain).toEqual(false)

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.environments.Developer.baseDomain
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Developer')).toThrowError('No baseDomain set for Developer')

      brokenConfig = _.cloneDeep(healthyConfig);
      (brokenConfig.environments.Developer as TestEnvData).webAppUrl = 'company.com'
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('deploy', 'Developer')).toThrowError('Cannot specify baseDomain when already given webAppUrl for Developer')

      brokenConfig = _.cloneDeep(healthyConfig)
      mockConfigHandler(brokenConfig)
      expect(((new MiraJobConfig('deploy', 'Developer')).details as ApplicationDetails).requireManualApproval).toEqual(false)
    })

    it('Handles CICD deployment', () => {
      let brokenConfig

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.profile
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('AWS profile undefined is missing role_arn or region information')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.buildspec_file
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.buildspec_file')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.source
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Could not determine repository provider')

      brokenConfig = _.cloneDeep(healthyConfig)
      brokenConfig.cicd.source = 'github'
      delete brokenConfig.cicd.github_token_secret_arn
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.github_token_secret_arn')

      brokenConfig = _.cloneDeep(healthyConfig)
      brokenConfig.cicd.source = 'codecommit'
      delete brokenConfig.cicd.codecommit_public_key
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.codecommit_public_key')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.repository_url
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.repository_url')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.branch_name
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.branch_name')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.cicd.steps
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('cicd')).toThrowError('Missing config.cicd.steps')
    })

    it('Handles DomainManager deployment', () => {
      let brokenConfig
      process.argv = ['npx', 'mira', 'domain']

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.domain
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('domain')).toThrowError('Missing config.domain')

      brokenConfig = _.cloneDeep(healthyConfig)
      delete brokenConfig.domain.hostedZoneId
      mockConfigHandler(brokenConfig)
      expect(() => new MiraJobConfig('domain')).toThrowError('Missing config.domain.hostedZoneId')
    })
  })
})
