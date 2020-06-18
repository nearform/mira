import { pascalCase } from 'change-case'
import { parseDomain, fromUrl, ParseResultType } from 'parse-domain'
import config from 'config'
import _ from 'lodash'
import AWS from 'aws-sdk'

export interface RoleConfig {
  readonly profile: string
  readonly account: string
  readonly region: string
}

// It is important that we disallow undefined here,
// otherwise resource name collisions may occur
export function nameResource (namespace: string, ...subNames: string[]): string {
  return [namespace, ...subNames].map(str => pascalCase(str + '')).join('-')
}

export interface EnvData {
  readonly name: string
  readonly profile: string
  readonly withDomain?: boolean
  readonly baseDomain?: string
  readonly webAppUrl?: string
  readonly requireManualApproval?: boolean
  readonly hostedZoneId?: 'string'
}

export interface Domain {
  readonly baseDomain: string
  readonly webAppUrl: string
}

// In developer mode build using a sub-domain of the base domain. Otherwise, parse the base domain from the web app URL.
export function getUrl (envData: EnvData, isDeveloperMode: boolean, stackName: string): Domain {
  // If webAppUrl is specified, always prefer the given value.
  if (envData.webAppUrl) {
    if (envData.baseDomain) {
      throw new Error(`Cannot specify baseDomain when already given webAppUrl for ${envData.name}`)
    }

    let baseDomain
    const parsedDomain = parseDomain(fromUrl(envData.webAppUrl))
    if (parsedDomain.type === ParseResultType.Listed) {
      baseDomain = `${parsedDomain.domain}.${parsedDomain.topLevelDomains.join('.')}`
    } else if (parsedDomain.type === ParseResultType.NotListed) {
      console.warn(`The webAppUrl url '${envData.webAppUrl}' domain is not listed.`)
      baseDomain = `${parsedDomain.labels.slice(-2).join('.')}`
    } else {
      throw new Error(`Is not possible to extract baseDomain from the webAppUrl '${envData.webAppUrl}'`)
    }
    return { baseDomain, webAppUrl: envData.webAppUrl }
  }

  // Outside of developer mode, webAppUrl is required.
  if (!isDeveloperMode) {
    throw new Error(`No webAppUrl set for ${envData.name}`)
  }

  // In developer mode, baseDomain is required.
  if (!envData.baseDomain) {
    throw new Error(`No baseDomain set for ${envData.name}`)
  }

  // In developer mode, webAppUrl will be generated unless it is specified in the config.
  const subdomain = stackName.toLowerCase()
  const webAppUrl = `${subdomain}.${envData.baseDomain}`
  return { baseDomain: envData.baseDomain, webAppUrl }
}

// FIXME: maybe there is a less hacky way to do this?
// https://stackoverflow.com/questions/44433527/how-to-load-config-from-aws-config
export function loadAWSProfile (profile: string): RoleConfig {
  // temporarily override
  const cleanups = []
  cleanups.push(overrideEnv('AWS_PROFILE', profile))
  cleanups.push(overrideEnv('AWS_SDK_LOAD_CONFIG', 'true'))
  // load
  const credentials = new AWS.SharedIniFileCredentials({ profile })
  const awsConfig = new AWS.Config({ credentials })
  // cleanup
  for (const cleanup of cleanups) cleanup()
  // delete require.cache['aws-sdk'] // hopefully this isn't needed
  // format
  const account = (_.get(awsConfig, 'credentials.roleArn', '').match(/:\d{12}:/) || [''])[0].replace(/:/gi, '')
  const region = awsConfig.region
  if (!account || !region) {
    throw new Error(`AWS profile ${profile} is missing role_arn or region information`)
  }
  return { profile, account, region }
}
function overrideEnv (key: string, value: string): Function {
  const before = process.env[key]
  process.env[key] = value
  return (): void => {
    if (before === 'undefined') delete process.env[key]
    else process.env[key] = before
  }
}

interface Environments { [key: string]: EnvData }
export function loadEnvironment (name: string): EnvData {
  const environments: Environments = config.get('environments')
  if (!environments) throw new Error('Missing config.environments')
  for (const key in environments) {
    const value = environments[key]
    environments[pascalCase(key)] = value
    if (key !== pascalCase(key)) {
      delete environments[key]
    }
  }
  const envData: EnvData = environments[pascalCase(name)]
  if (!envData) {
    throw new Error(`Cannot find config for environment ${name || 'undefined'}`)
  }
  return {
    ...envData,
    name
  }
}
