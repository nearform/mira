import { IConfig } from 'config'
import { Config } from '../src/config/mira-config'

const config: Record<string, unknown> = {
  'app.prefix': 'John',
  'app.name': 'My Great App',
  profile: true,
  cicd: {
    repositoryUrl: 'https://github.com/nearform/mira',
    codeCommitUserPublicKey: 'ssh-rsa ...',
    provider: 'codecommit'
  },
  'dev.target': 'cicd',
  'cicd.target': 'cicd',
  'cicd.stages': [
    {
      target: 'staging',
      withDomain: false,
      requireManualApproval: false
    }
  ],
  accounts: true,
  'accounts.cicd': {
    env: {
      account: 'ACCOUNT_NUMER',
      region: 'REGION'
    },
    profile: 'mira-dev'
  },
  'accounts.test': {
    env: {
      account: 'ACCOUNT_NUMER',
      region: 'REGION'
    },
    profile: true
  },
  'accounts.dev': {
    env: {
      account: 'ACCOUNT_NUMER',
      region: 'REGION'
    },
    profile: true
  },
  'accounts.staging': {
    env: {
      account: 'ACCOUNT_NUMER',
      region: 'REGION'
    },
    profile: 'mira-dev'
  }
}

const configMock: IConfig = {
  get<T> (setting: string): T {
    return config[setting] as T
  },
  has (setting: string): boolean {
    return setting in config
  },
  util: {
    loadFileConfigs (): Config {
      return {
        app: {
          name: 'S3Webhosting',
          prefix: 'Nf'
        },
        dev: {
          target: 'default'
        },
        accounts: {
          default: {
            name: 'hello',
            profile: 'mira-dev',
            env: {
              account: '101259067028',
              region: 'eu-west-1'
            }
          },
          test: {
            name: 'hello',
            profile: 'mira-dev',
            env: {
              account: '101259067028',
              region: 'eu-west-1'
            }
          }
        }
      }
    }
  } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}
/*
  The `any` type in the line above is required to accomplish the same value returned by
  the `loadFileConfigs` function in the `config` module
 */

export default configMock
