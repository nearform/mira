import { IConfig } from 'config'

const config: Record<string, unknown> = {
  'app.prefix': 'nearFORM',
  'app.name': 'mira',
  cicd: true,
  'cicd.source': 'github',
  'cicd.repository_url': '[config.cicd.repository_url]',
  'cicd.github_token_secret_arn': '[cicd.github_token_secret_arn]',
  profile: true,
  'cicd.accounts': [{
    name: 'Staging',
    requireManualApproval: false
  }]
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
