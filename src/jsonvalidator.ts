import S from 'fluent-schema'
import Ajv from 'ajv'
import * as fs from 'fs'
import * as path from 'path'
/* This function programmatically defines the default.json file */
export function getConfigSchema (): object {
  return S.object()
    .id('default-config')
    .title('Default Config File Schema')
    .description('Default Config File Schema')
    .prop(
      'app',
      S.object()
        .prop('prefix', S.string().required())
        .prop('name', S.string().required())
    )
    .required()
    .prop(
      'accounts',
      S.object()
    )
    .prop(
      'costCenter',
      S.string()
    )
    .prop(
      'cicd',
      S.object()
        .prop('target', S.string())
        .prop('buildspecFile', S.string())
        .prop('permissionsFile', S.string())
        .prop('provider', S.string())
        .prop('profile', S.string())
        .prop('repositoryUrl', S.string())
        .prop('branchName', S.string())
        .prop('codeCommitUserPublicKey', S.string())
        .prop('environmentVariables', S.array())
        .prop(
          'stages',
          S.array().items(
            S.object()
              .prop('target', S.string())
              .prop('withDomain', S.boolean())
              .prop('requireManualApproval', S.boolean())
          )
        )
    )
    .allOf([
      S.ifThen(
        S.object().prop(
          'cicd',
          S.object().prop('target', S.string().required())
        ),
        S.required(['accounts'])
      ),
      S.ifThen(
        S.object().prop(
          'cicd',
          S.object().prop('stages', S.array().items(
            S.object()
              .prop('target', S.string()).required()
          ))
        ),
        S.required(['accounts'])
      )
    ])
    .prop('dev', S.object().prop('target', S.string()))
    .ifThen(
      S.object().prop('dev', S.object().prop('target', S.string().required())),
      S.required(['accounts'])
    )
    .valueOf()
}

/**
 * Reads the defined file and returns it.
 */
export function readJsonFile (filePath: string): string {
  const file = path.join(__dirname, filePath)

  if (!fs.existsSync(file)) {
    throw Error('Could not read file: ' + filePath)
  }
  const configRaw = JSON.parse(fs.readFileSync(file, 'utf-8'))
  return configRaw
}

/* Uses a programmatically defined schema and validates a data input. */
export function validateConfig (config: object): boolean {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true })
  const valid = ajv.validate(getConfigSchema(), config)

  if (!valid) {
    throw Error('Validation failed: ' + JSON.stringify(ajv.errors))
  } else {
    return true
  }
}
