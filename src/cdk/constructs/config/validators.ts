import { execFile } from 'child_process'

export function isValidAwsAccountId (input: string): boolean {
  if (!input) return false
  return /^\d{12}$/.test(input)
}

export function isValidAwsAccountIdList (input: string): boolean {
  if (!input) return false
  for (const id of input.split(',')) {
    if (!isValidAwsAccountId(id)) return false
  }
  return true
}

export async function isValidAwsCliProfile (input: string): Promise<unknown> {
  return new Promise((resolve) => {
    if (!input) return resolve(false)

    execFile('aws', ['configure', 'list', '--profile', input], (error) => {
      if (error?.code) {
        console.log(`\nProfile "${input}" not found.`)
        return resolve(false)
      }
      resolve(true)
    })
  })
}

export function isValidAwsHostedZoneId (input: string): boolean {
  if (!input) return false
  return /^Z[A-Z0-9]{1,32}$/.test(input)
}

export function isValidBaseDomain (input: string): boolean {
  if (!input) return false
  return /^[a-zA-Z0-9-]{1,61}\.[a-zA-Z]{2,}$/.test(input)
}

export function isValidDomain (input: string): boolean {
  if (!input) return false
  return /^(?:[a-zA-Z0-9-]{1,61}\.)+[a-zA-Z]{2,}$/.test(input)
}

export async function isValidGitBranchName (input: string): Promise<unknown> {
  return new Promise((resolve) => {
    if (!input) return resolve(false)

    execFile('git', ['check-ref-format', '--branch', input], (error) => {
      if (error?.code) {
        return resolve(false)
      }
      resolve(true)
    })
  })
}

export function isValidEnvironmentNameList (input: string): boolean {
  const envNameRegex = /^[a-zA-Z][a-zA-Z0-9]+$/
  return input.split(',').every(env => envNameRegex.test(env))
}

export function isValidSshRsaPublicKey (input: string): boolean {
  if (!input) return false
  return /^ssh-rsa AAAA[0-9a-z+/]+[=]{0,3}/i.test(input)
}

export function isValidAwsSecretsManagerArn (input: string): boolean {
  if (!input) return false
  return /^arn:aws:secretsmanager:[a-z]{2}((-gov)|(-iso(b?)))?-[a-z]+-\d{1}:\d{12}:secret:[a-zA-Z0-9-_]+$/.test(input)
}
