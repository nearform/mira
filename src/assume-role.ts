'use strict'
import aws from 'aws-sdk'
import { execFileSync } from 'child_process'
import fs from 'fs'

/**
 * Allow Mira to assume a role based on a given arn. This is used for deployment
 * and allows Mira to use the account specified in the configuration file.
 *
 * @internal
 * @throws Cannot assume role ${roleArn}: Invalid Role
 * @throws Cannot assume role ${roleArn}: &lt;other reason&gt;
 */
export async function assumeRole (roleArn: string): Promise<AWS.Config> {
  console.log(`Assuming role ${roleArn}`)
  const sts = new aws.STS()
  try {
    const roleData = await sts.assumeRole({
      RoleArn: `${roleArn}`,
      RoleSessionName: 'mira-assumed-role'
    }).promise()
    if (roleData.Credentials) {
      aws.config = new aws.Config({
        accessKeyId: roleData.Credentials.AccessKeyId,
        secretAccessKey: roleData.Credentials.SecretAccessKey,
        sessionToken: roleData.Credentials.SessionToken
      })
      // update environment
      const authData = [
        { name: 'aws_access_key_id', value: roleData.Credentials.AccessKeyId },
        { name: 'aws_secret_access_key', value: roleData.Credentials.SecretAccessKey },
        { name: 'aws_session_token', value: roleData.Credentials.SessionToken }
      ]

      authData.forEach((token) => {
        const commandOptions = [
          'configure',
          'set',
          token.name,
          token.value,
          '--profile=client'
        ]
        execFileSync(
          'aws', commandOptions, {
            stdio: 'inherit',
            env: {
              ...process.env
            }
          }
        )
      })
      return aws.config
    } else {
      throw new Error(`Cannot assume role ${roleArn}: Invalid Role`)
    }
  } catch (error) {
    throw new Error(`Cannot assume role ${roleArn}: ${error.message}`)
  }
}

/**
 * Given a provided profile, reads the users local ~/.aws/config file and
 * @param {*} profile
 */
export const getRoleArn = (profile: string): string => {
  const cwd = process.cwd()
  process.chdir(process.env.HOME || '')
  if (!fs.existsSync('.aws/config')) {
    // TODO: Throw an error?
    process.chdir(cwd)
    throw new Error('Role not found')
  }
  const lines = fs.readFileSync('.aws/config', 'utf8').split(/\n/g)
  process.chdir(cwd)
  const idx = lines.findIndex((line: string) => {
    const regexp = new RegExp(`\\[profile ${profile}`)
    return !!regexp.exec(line)
  })
  if (idx === -1) {
    // TODO: Throw an error?
    throw new Error('Role not found')
  }
  const roleLine = lines.slice(idx).find((line: string) => !!line.match(/^\s*role_arn\s*=/))
  if (!roleLine) {
    // TODO: Throw an error if roleLine is null?
    throw new Error('Role not found')
  }
  return roleLine.split(/=/).slice(1).join('=').trim()
}
