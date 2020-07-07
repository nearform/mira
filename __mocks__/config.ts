import { IConfig } from 'config'

const config: Record<string, unknown> = {
  'app.prefix': 'John',
  'app.name': 'My Great App',
  profile: true,
  cicd: {
    repositoryUrl: 'https://github.com/nearform/mira',
    codeCommitUserPublicKey: 'ssh-rsa ...',
    provider: 'codecommit'
  },
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
  util: null as any
}

export default configMock
