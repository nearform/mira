/**
 * This module provides the AWS region autocomplete for the config bootstrap.
 * @internal
 */

/** @ignore */
const REGIONS = [
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'cn-north-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'me-south-1',
  'sa-east-1',
  'us-gov-east-1',
  'us-gov-west-1'
]

/**
 * Build an autocomplete list of AWS regions
 *
 * @internal
 * @ignore
 * */
export function buildSearchRegions () {
  return async function searchRegions (this: unknown, _: unknown, input: string): Promise<string[]> {
    input = input || ''
    return REGIONS.filter(region => region.startsWith(input))
  }
}
