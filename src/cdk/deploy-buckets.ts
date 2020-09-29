/**
 * Deploys Custom::CDKBucketDeployment resources without using the CDK
 * toolchain.
 */
import AWS from 'aws-sdk'
import assert from 'assert'
import fs from 'fs'
import colors from 'colors/safe'
import cp from 'child_process'
import config from 'config'
import { assumeRole } from '../assume-role'
import glob from 'glob'
import { MiraApp } from './app'
import { MiraConfig, Account } from '../config/mira-config'
import { PromiseResult } from 'aws-sdk/lib/request'
import { Bucket } from 'aws-sdk/clients/s3'
let cdkFiles = fs.existsSync('cdk.out') ? fs.readdirSync('cdk.out') : []
const { getBaseStackNameFromParams } = MiraApp
let miraS3: AWS.S3

interface LooseObject {
    /* eslint-disable-next-line */
    [key: string]: any
}

/**
 * Gets the files within an asset folder.
 */
export const getAssetFiles = async (id: string): Promise<Array<string>> => {
  assert(fs.existsSync(getAssetPrefix(id)) &&
        fs.statSync(getAssetPrefix(id)).isDirectory(), 'A provided asset ID' +
        ' either did not exist or was not a directory.  Was this intended?')
  return new Promise((resolve, reject) => {
    glob(`${getAssetPrefix(id)}/**/*`, (err: Error | null, matches: string[]) => {
      if (err) {
        reject(err)
      }
      resolve(matches.map((match: string) => match.substr(getAssetPrefix(id).length + 1)))
    })
  })
}

/**
 * Gets the asset prefix given some ID.
 */
export const getAssetPrefix = (id: string): string => `cdk.out/asset.${id}`

/**
 * Gets the objects from a bucket.
 */
export const getBucketObjects = async (Bucket: string): Promise<PromiseResult<AWS.S3.ListObjectsOutput, AWS.AWSError>> => {
  const s3 = await getS3()
  return s3.listObjects({ Bucket }).promise()
}

interface CDKTemplateResource {
    Type: string
    Properties: {
        DestinationBucketName: {
            Ref: string
        }
        SourceBucketNames: Array<{Ref: string}>
    }
}
interface CDKTemplate {
    Resources: {[key: string]: CDKTemplateResource}
}

/**
 * Gets references for bucket.
 */
export const getBucketRefs = async (): Promise<LooseObject> => {
  const files = getTemplateFiles()
  const bucketsBySite = await getSiteBuckets()
  for (const file in files) {
    const template: CDKTemplate = files[file] as CDKTemplate
    if (!template.Resources) {
      continue
    }
    for (const name in template.Resources) {
      if (!template.Resources[name]) {
        continue
      }
      const { Type, Properties } = template.Resources[name]
      if (!Type) {
        continue
      }
      if (Type !== 'Custom::CDKBucketDeployment') {
        continue
      }
      if (!bucketsBySite[Properties.DestinationBucketName.Ref]) {
        // TODO: Throw an error or provide warning?
        console.warn('Something unexpected happened.  Found a ' +
                    'Custom::CDKBucketDeployment with a DestinationBucketName' +
                    ' that is unknown.', Properties.DestinationBucketName.Ref)
        continue
      }
      bucketsBySite[Properties.DestinationBucketName.Ref].assets =
                Properties.SourceBucketNames.map(({ Ref }: LooseObject) => {
                  return Ref.split(/AssetParameters/g)[1].split(/S3Bucket/g)[0]
                })
    }
  }
  return bucketsBySite
}

/**
 * Given some template JSON, grabs all resource objects that are of type
 * AWS::S3::Bucket.
 */
export const getBucketResources = (): LooseObject => {
  const files = getTemplateFiles()
  const bucketsByFile = {} as LooseObject
  for (const file in files) {
    const template = files[file]
    if (!template.Resources) {
      continue
    }
    for (const name in template.Resources) {
      const { Type } = template.Resources[name]
      if (!Type) {
        continue
      }
      if (Type !== 'AWS::S3::Bucket') {
        continue
      }
      if (!bucketsByFile[file]) {
        bucketsByFile[file] = {}
      }
      bucketsByFile[file][name] = template.Resources[name]
    }
  }
  return bucketsByFile
}

/**
 * Gets the environment for Mira.
 */
export const getEnvironment = (): Account => {
  const env = MiraConfig.getEnvironment()
  return env
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

/**
 * Gets the S3 object.
 */
export const getS3 = async (): Promise<AWS.S3> => {
  if (miraS3) {
    return miraS3
  }
  const role = getRoleArn(config.get(`accounts.${getEnvironment().name}.profile`))
  const awsConfig = await assumeRole(role)
  AWS.config = awsConfig
  miraS3 = new AWS.S3({ apiVersion: '2006-03-01' })
  return miraS3
}

/**
 * Gets S3 buckets beginning with a prefix.
 * @param {String} prefix
 * @param {String} siteName
 */
export const getS3Buckets = async (prefix: string, siteName: string): Promise<Bucket[]> => {
  const s3 = await getS3()
  const response: AWS.S3.ListBucketsOutput = await s3.listBuckets().promise()
  if (!response || !response.Buckets) {
    throw new Error('Failed to retrieve buckets.')
  }
  prefix = prefix.toLowerCase().slice(0, 30)
  siteName = siteName.toLowerCase()
  const bucketPrefix = `${prefix}-${siteName}`
  const targetBuckets = response.Buckets.filter(({ Name }: LooseObject) => {
    return Name.startsWith(bucketPrefix)
  })
  return targetBuckets
}

/**
 * For a given template file, gets all site buckets.
 */
export const getSiteBuckets = async (): Promise<LooseObject> => {
  const files = getTemplateFiles()
  const siteBuckets = {} as LooseObject
  const bucketsByFile: LooseObject = getBucketResources()
  for (const file in files) {
    if (!bucketsByFile[file]) {
      continue
    }
    for (const name in bucketsByFile[file]) {
      const { Properties } = bucketsByFile[file][name]
      const { Value: stackName } = Properties.Tags.find(({ Key }: LooseObject) => Key === 'StackName')
      const s3Buckets = await getS3Buckets(stackName, name)
      siteBuckets[name] = {
        s3: s3Buckets.map(({ Name }: LooseObject) => Name)
      }
    }
  }
  return siteBuckets
}

/**
 * Gets the stack name.
 */
export const getStackName = (): string => {
  const stackName = getBaseStackNameFromParams(config.get('app.prefix'),
    config.get('app.name'), 'Service')
  return stackName
}

/**
 * Gets the template files for the given CWD.
 */
export const getTemplateFiles = (): LooseObject => {
  const templateFiles = {} as LooseObject
  cdkFiles = cdkFiles.filter((file: string) => file.endsWith('.template.json'))
  for (const file of cdkFiles) {
    templateFiles[file] = JSON.parse(fs.readFileSync(`cdk.out/${file}`, 'utf8'))
  }
  return templateFiles
}

/**
 * Removes assets directories.
 */
export const removeAssetDirectories = (): void => {
  for (const dir of cdkFiles) {
    if (fs.statSync(`cdk.out/${dir}`).isDirectory()) {
      cp.execSync(`rm -rf ${dir}`, {
        cwd: `${process.cwd()}/cdk.out`
      })
    }
  }
}

/**
 * Quickly deploys an asset bundle generated by CDK to an intended S3 bucket
 * as defined by a CDK generated Cfn template.
 */
export const quickDeploy = async (): Promise<void> => {
  const sites = await getBucketRefs()
  const s3 = await getS3()
  for (const site in sites) {
    const { s3: buckets, assets } = sites[site]
    for (const Bucket of buckets) {
      console.info(colors.yellow('Updating Bucket'), Bucket)
      for (const id of assets) {
        const files = await getAssetFiles(id)
        for (const file of files) {
          const obj = {
            ACL: 'public-read',
            Body: fs.readFileSync(`${getAssetPrefix(id)}/${file}`, 'utf8'),
            Bucket,
            ContentType: require('mime-types').lookup(file),
            Key: file
          }
          if (MiraApp.isVerbose()) {
            console.info(`Putting object: ${JSON.stringify(obj, null, 2)}`)
          } else {
            console.info(`\n${colors.yellow('Putting object:')}\n${file}`)
          }
          const result = await s3.putObject(obj).promise()
          if (MiraApp.isVerbose()) {
            console.info(`Put object: ${JSON.stringify(result, null, 2)}`)
          }
          console.info(`${colors.cyan('File Available at')}: https://${Bucket}.s3-${getEnvironment().env.region}.amazonaws.com/${file}`)
        }

        console.info(colors.green('Done Updating Bucket'))
      }
    }
  }
}
