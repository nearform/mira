'use strict'
import aws from 'aws-sdk'
import { execFileSync } from 'child_process'

export async function assumeRole (roleArn: string): Promise<void> {
  console.log(`Assuming role ${roleArn}`)
  const sts = new aws.STS()
  try {
    const roleData = await sts.assumeRole({
      RoleArn: `${roleArn}`,
      RoleSessionName: 'mira-assumed-role'
    }).promise()
    if (roleData.Credentials) {
      aws.config.update({
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
    } else {
      throw new Error(`Cannot assume role ${roleArn}: Invalid Role`)
    }
  } catch (error) {
    throw new Error(`Cannot assume role ${roleArn}: ${error.message}`)
  }
}
