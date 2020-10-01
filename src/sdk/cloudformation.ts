import AWS, { CloudFormation } from 'aws-sdk'

import config from 'config'
import { getStackName } from '../cdk/app'
import { getRoleArn, assumeRole } from '../assume-role'
import { MiraConfig } from '../config/mira-config'

/**
 * Gets the full stack name.
 * @todo Refactor this into a more proper place.
 */
export const getFullStackName = (): string => {
  return `${getStackName()}-${MiraConfig.getEnvironment().name}`
}

let miraCfn: AWS.CloudFormation
/**
 * Gets a Cfn object.
 */
export const getCfn = async (): Promise<CloudFormation> => {
  if (miraCfn) {
    return miraCfn
  }
  const awsConfig = await assumeRole(getRoleArn(config.get(`accounts.${MiraConfig.getEnvironment().name}.profile`)))
  awsConfig.region = MiraConfig.getEnvironment().env.region
  AWS.config = awsConfig
  miraCfn = new AWS.CloudFormation({ apiVersion: '2010-05-15' })
  return miraCfn
}

/**
 * Gets the stacks that are in progress.  This can be used to detect if a stack
 * is in progress of being pushed.
 * @todo
 */
// export const getInProgressStacks = (): void => {

// }

/**
 * Gets the resources included in a stack.
 */
export const getStackResources = async (StackName: string): Promise<LooseObject> => {
  const cfn = await getCfn()
  return new Promise((resolve, reject) => {
    cfn.listStackResources({
      StackName
    }, (err, data) => {
      if (err) {
        reject(err)
      } else if (data) {
        resolve(data)
      }
    })
  })
}

/**
 * Gets all stacks that have a state suffix of `_COMPLETE`.
 */
export const getStacks = async (filter?: string): Promise<LooseObject> => {
  const cfn = (await getCfn())
  return new Promise((resolve, reject) => {
    cfn.listStacks({
      StackStatusFilter: [
        'IMPORT_COMPLETE',
        'UPDATE_ROLLBACK_COMPLETE',
        'UPDATE_COMPLETE',
        'ROLLBACK_COMPLETE',
        'CREATE_COMPLETE'
      ]
    }, async (err, data) => {
      if (err) {
        reject(err)
      } else if (data && data.StackSummaries) {
        let stacks = data.StackSummaries
        if (filter) {
          stacks = data.StackSummaries.filter(({ StackName }) => StackName.startsWith(filter))
        }
        resolve(stacks)
      }
    })
  })
}

/**
 * Gets all stacks are associated with this Mira instance.
 */
export const getInstaceStacks = async (): Promise<LooseObject> => {
  const stackName = `${getStackName()}-${MiraConfig.getEnvironment().name}`
  return getStacks(stackName)
}

interface LooseObject {
    /* eslint-disable-next-line */
    [key: string]: any
}

/**
 * Gets all of the resources for this particular instance.
 */
export const getInstanceResources = async (): Promise<LooseObject> => {
  const stackResources: LooseObject = {}
  const stacks = await exports.getInstaceStacks()
  for (const stack of stacks) {
    stackResources[stack.StackName] = await exports.getStackResources(stack.StackName)
    stackResources[stack.StackName] = stackResources[stack.StackName].StackResourceSummaries
  }
  return stackResources
}

/**
 * Gets all of the resources for this particular instance.
 */
export const getInstanceResourcesByType = async (): Promise<LooseObject> => {
  const stackResources: LooseObject = await getInstanceResources()
  const stackResourcesByType: LooseObject = {}
  for (const stackName in stackResources) {
    if (!stackResourcesByType[stackName]) {
      stackResourcesByType[stackName] = {}
    }
    for (const stackResource of stackResources[stackName]) {
      const resourceType = stackResource.ResourceType
      if (!stackResourcesByType[stackName][resourceType]) {
        stackResourcesByType[stackName][resourceType] = []
      }
      stackResourcesByType[stackName][resourceType].push(stackResources[stackName])
    }
  }
  return stackResourcesByType
}
