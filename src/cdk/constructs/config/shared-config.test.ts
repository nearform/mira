import { App } from '@aws-cdk/core'
import { SharedConfig } from './shared-config'

jest.mock('config')

class TestSharedConfig extends SharedConfig {}

const { env: originalEnv } = process

describe.skip('Shared config', () => {
  beforeAll(() => {
    process.env.CDK_DEFAULT_ACCOUNT = 'my_default_account'
    process.env.CDK_DEFAULT_REGION = 'my_default_region'
  })

  it('Gets context from scope', async () => {
    const app = new App()
    const config = new TestSharedConfig(app)
    const { env, projectName, projectOwner } = config

    expect(env).toEqual({
      account: 'my_default_account',
      region: 'my_default_region'
    })
    expect(projectName).toEqual('Mira')
    expect(projectOwner).toEqual('NearForm')
  })

  it('Gets context without scope', async (): Promise<void> => {
    const config = new TestSharedConfig()
    const { env, projectName, projectOwner } = config

    expect(env).toEqual({
      account: 'my_default_account',
      region: 'my_default_region'
    })
    expect(projectName).toEqual('Mira')
    expect(projectOwner).toEqual('NearForm')
  })

  /** @todo fix - was broken */
  it.skip('Reads project name and owner from package.json', async () => {
    const app = new App()
    let config: TestSharedConfig

    process.env = {
      // eslint-disable-next-line @typescript-eslint/camelcase
      npm_package_repository_url: 'https://github.com/a/b.git'
    }

    try {
      config = new TestSharedConfig(app)
    } finally {
      process.env = originalEnv
    }

    const { projectName, projectOwner } = config
    expect(projectName).toEqual('B')
    expect(projectOwner).toEqual('A')
  })

  it('Gets env from environment variables', async () => {
    const app = new App()
    let config: TestSharedConfig

    process.env = {
      ...process.env,
      CDK_DEFAULT_ACCOUNT: 'f',
      CDK_DEFAULT_REGION: 'g'
    }

    try {
      config = new TestSharedConfig(app)
    } finally {
      process.env = originalEnv
    }

    const { env } = config
    expect(env).toEqual({
      account: 'f',
      region: 'g'
    })
  })
})
