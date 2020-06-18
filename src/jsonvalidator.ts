import S from 'fluent-schema'
import Ajv from 'ajv'
import * as fs from 'fs'

/* This function programmatically defines the CDK.json file */
export function getCdkSchema (): object {
  const schema = S.object()
    .title('CDK-JSON-File-format')
    .description('Json schema for cdk.json file format.')
    .prop('context', S.object()
      .prop('Developer', S.object()
        .prop('env', S.object()
          .prop('account', S.string().required())
          .prop('region', S.string().required())
        ).required()
        .prop('profile', S.string().required())
        .prop('withDomain', S.string().required())
        .prop('baseDomain', S.string().required())
      ).required()
      .prop('Cicd', S.object()
        .prop('env', S.object()
          .prop('account', S.string().required())
          .prop('region', S.string().required())
        ).required()
        .prop('profile', S.string().required())
        .prop('accounts', S.array().required())
        .prop('branchName', S.string().required())
        .prop('gitHubTokenSecretArn', S.string().required())
        .prop('codeCommitUserPublicKey', S.string().required())
        .prop('repositoryProvider', S.string().required())
        .prop('baseDomain', S.string().required())
      ).required()
      .prop('FederationAccounts', S.array().minItems(1).required())
      .prop('lastGenerated', S.string())
      .prop('DomainManager', S.object()
        .prop('env', S.object()
          .prop('account', S.string().required())
          .prop('region', S.string().required())
        ).required()
        .prop('profile', S.string().required())
        .prop('baseDomain', S.string().required())
        .prop('hostedZoneId', S.string().required())
      ).required()
      .prop('Staging', S.object()
        .prop('env', S.object()
          .prop('account', S.string().required())
          .prop('region', S.string().required())
        ).required()
        .prop('profile', S.string().required())
        .prop('withDomain', S.boolean().required())
        .prop('webAppUrl', S.string().required())
        .prop('requireManualApproval', S.boolean().required())
      ).required()
      .prop('Production', S.object()
        .prop('env', S.object()
          .prop('account', S.string().required())
          .prop('region', S.string().required())
        ).required()
        .prop('profile', S.string().required())
        .prop('withDomain', S.boolean().required())
        .prop('webAppUrl', S.string().required())
        .prop('requireManualApproval', S.boolean().required())
      ).required()
    ).required()
    .valueOf()
  return schema
}

/**
 * Reads the defined file and returns it.
 */
export function readCdkJson (cdkPath: string): string {
  if (!fs.existsSync(cdkPath)) {
    throw Error('Could not read file: ' + cdkPath)
  }
  const cdkConfigRaw = JSON.parse(fs.readFileSync(cdkPath, 'utf-8'))
  return cdkConfigRaw
}

/* Uses a programmatically defined schema and validates a data input. */
export function validateCdkJson (jsonschema: object, jsonfile: string): boolean {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true })
  const validate = ajv.compile(jsonschema)
  const valid = validate(readCdkJson(jsonfile))
  if (!valid) {
    throw Error('Validation failed: ' + JSON.stringify(validate.errors))
  } else {
    return true
  }
}
