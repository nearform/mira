import * as validators from './validators'
import { execFile } from 'child_process'

describe('Validators', () => {
  it('isValidAwsAccountId', async () => {
    expect(validators.isValidAwsAccountId('123456789012')).toBeTruthy()
    expect(validators.isValidAwsAccountId('000000000000')).toBeTruthy()

    expect(validators.isValidAwsAccountId('')).toBeFalsy()
    expect(validators.isValidAwsAccountId('12345678901')).toBeFalsy()
    expect(validators.isValidAwsAccountId('1234567890123')).toBeFalsy()
  })

  it('isValidAwsAccountIdList', async () => {
    expect(validators.isValidAwsAccountIdList('123456789012')).toBeTruthy()
    expect(validators.isValidAwsAccountIdList('123456789012,000000000000')).toBeTruthy()

    expect(validators.isValidAwsAccountIdList('')).toBeFalsy()
    expect(validators.isValidAwsAccountIdList('12345678901')).toBeFalsy()
    expect(validators.isValidAwsAccountIdList('1234567890123')).toBeFalsy()
    expect(validators.isValidAwsAccountIdList('123456789012,')).toBeFalsy()
    expect(validators.isValidAwsAccountIdList('1234567890123,000000000000')).toBeFalsy()
  })

  it('isValidAwsCliProfile', async () => {
    expect(await validators.isValidAwsCliProfile('')).toBeFalsy()
    expect(await validators.isValidAwsCliProfile('value')).toBeFalsy()
    await execFile('aws', ['configure', 'set', 'region', 'eu-west-1', '--profile', 'user1'])
    expect(await validators.isValidAwsCliProfile('user1')).toBeTruthy()
  })

  it('isValidAwsHostedZoneId', async () => {
    expect(validators.isValidAwsHostedZoneId('ZABCDEF1234567')).toBeTruthy()

    expect(validators.isValidAwsHostedZoneId('')).toBeFalsy()
    expect(validators.isValidAwsHostedZoneId('ZABCDEF123456ZABCDEF123456ZABCDEF123456')).toBeFalsy()
  })

  it('isValidBaseDomain', async () => {
    expect(validators.isValidBaseDomain('a.co')).toBeTruthy()
    expect(validators.isValidBaseDomain('ab.com')).toBeTruthy()

    expect(validators.isValidBaseDomain('')).toBeFalsy()
    expect(validators.isValidBaseDomain('.c')).toBeFalsy()
    expect(validators.isValidBaseDomain('.co')).toBeFalsy()
    expect(validators.isValidBaseDomain('a.c')).toBeFalsy()
    expect(validators.isValidBaseDomain('a.b.co')).toBeFalsy()
  })

  it('isValidDomain', async () => {
    expect(validators.isValidDomain('a.co')).toBeTruthy()
    expect(validators.isValidDomain('ab.com')).toBeTruthy()
    expect(validators.isValidDomain('b.a.co')).toBeTruthy()
    expect(validators.isValidDomain('c.ab.com')).toBeTruthy()

    expect(validators.isValidDomain('')).toBeFalsy()
    expect(validators.isValidDomain('.c')).toBeFalsy()
    expect(validators.isValidDomain('.co')).toBeFalsy()
    expect(validators.isValidDomain('a.c')).toBeFalsy()
  })

  it('isValidGitBranchName', async () => {
    expect(await validators.isValidGitBranchName('')).toBeFalsy()
    expect(await validators.isValidGitBranchName(' ')).toBeFalsy()
    expect(await validators.isValidGitBranchName('value')).toBeTruthy()
  })

  it('isValidEnvironmentNameList', async () => {
    expect(validators.isValidEnvironmentNameList('ab')).toBeTruthy()
    expect(validators.isValidEnvironmentNameList('a1')).toBeTruthy()
    expect(validators.isValidEnvironmentNameList('ab,cd')).toBeTruthy()
    expect(validators.isValidEnvironmentNameList('a1,B2')).toBeTruthy()

    expect(validators.isValidEnvironmentNameList('')).toBeFalsy()
    expect(validators.isValidEnvironmentNameList('12')).toBeFalsy()
    expect(validators.isValidEnvironmentNameList('a,b')).toBeFalsy()
    expect(validators.isValidEnvironmentNameList('ab ,cd')).toBeFalsy()
    expect(validators.isValidEnvironmentNameList('ab, cd')).toBeFalsy()
  })

  it('isValidSshRsaPublicKey', async () => {
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA0')).toBeTruthy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA0=')).toBeTruthy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA0==')).toBeTruthy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA0===')).toBeTruthy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDarLg8uPkfeT+0BvNYuUYT' +
      'Y8/j78dR13JCf0mgKrnI1vRdyPwj40fInztdBZho+tB/i1/q70uV0lmpFBe3' +
      'c2gyrXE7l5cWPgDXBOskxARz/PRBFxvPXIhEUplMAEgvcoRjmBDfzL0xDwTD' +
      'ao90lP4uzKhir0Y9+x/0sD4fxwsMOWd5/sa+xTpadYjiZW66xgRLcJKEy+NQ' +
      '6B5DGVuKdgPNr2UsvD9NQVM/UG60O2gKf1MYb1WZaN/y2aD096OmFBCnpyxZ' +
      'mA0W2R4NIB6nGsTi4xCWrE9o0E6njO7vctMWaS0RbhAco2mEyo10vZg7ryDR' +
      '6Ho5kzJKLzoXJFInOvjB'
    )).toBeTruthy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA0 some comment $%@')).toBeTruthy()

    expect(validators.isValidSshRsaPublicKey('')).toBeFalsy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAA')).toBeFalsy()
    expect(validators.isValidSshRsaPublicKey('ssh-rsa AAAA')).toBeFalsy()
  })

  it('isValidAwsSecretsManagerArn', async () => {
    expect(validators.isValidAwsSecretsManagerArn('arn:aws:secretsmanager:eu-west-1:123456789012:secret:a')).toBeTruthy()

    expect(validators.isValidAwsSecretsManagerArn('')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('::secretsmanager:eu-west-1:123456789012:secret:a')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('arn::secretsmanager:eu-west-1:123456789012:secret:a')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('arn:aws::eu-west-1:123456789012:secret:a')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('arn:aws:secretsmanager::123456789012:secret:a')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('arn:aws:secretsmanager:eu-west-1:123456789012::a')).toBeFalsy()
    expect(validators.isValidAwsSecretsManagerArn('arn:aws:secretsmanager:eu-west-1:123456789012:secret:')).toBeFalsy()
  })
})
