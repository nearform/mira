import { pascalCase } from 'change-case'
import config from 'config'

/**
 * @deprecated
 */
export function getBaseStackName (suffix? : string): string {
  const pieces = [
    config.get('app.prefix'),
    config.get('app.name'),
    suffix
  ]
  const output = pieces
    .filter((p) => p)
    .map((p) => pascalCase(p as string))
  return output.join('-')
}

/**
 * @deprecated
 */
export function getDeployProjectRoleName (environment: string): string {
  return `${getBaseStackName()}-DeployProjectRole-${environment}`
}
