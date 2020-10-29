import { pascalCase } from 'change-case'

export function getBaseStackNameFromParams (prefix: string, name: string, suffix? : string): string {
  const pieces = [
    prefix,
    name,
    suffix
  ]
  const output = pieces
    .filter((p) => p)
    .map((p) => pascalCase(p as string))
  return output.join('-')
}
