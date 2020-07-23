// eslint-disable-next-line
const colors = require('colors')
// eslint-disable-next-line
const fs = require('fs')

const supportedCdkVersion = '1.49.1'
const supportedCdkVersionString = `"${supportedCdkVersion}"`

/**
 * This string represents ready to copy dependencies needed for Mira to work.
 * @type {string}
 */
const mandatoryDepsMessage = `
Please make sure to include the following dependencies for your project:
    "aws-cdk": ${supportedCdkVersionString},
    "@aws-cdk/aws-cloudformation": ${supportedCdkVersionString},
    "@aws-cdk/aws-codebuild": ${supportedCdkVersionString},
    "@aws-cdk/aws-codecommit": ${supportedCdkVersionString},
    "@aws-cdk/aws-codepipeline": ${supportedCdkVersionString},
    "@aws-cdk/aws-codepipeline-actions": ${supportedCdkVersionString},
    "@aws-cdk/aws-iam": ${supportedCdkVersionString},
    "@aws-cdk/aws-lambda-event-sources": ${supportedCdkVersionString},
    "@aws-cdk/aws-lambda": ${supportedCdkVersionString},
    "@aws-cdk/aws-s3-assets": ${supportedCdkVersionString},
    "@aws-cdk/aws-secretsmanager": ${supportedCdkVersionString},
    "@aws-cdk/custom-resources": ${supportedCdkVersionString},
    "@aws-cdk/aws-sns": ${supportedCdkVersionString},
    "@aws-cdk/aws-s3": ${supportedCdkVersionString},
    "@aws-cdk/aws-sqs": ${supportedCdkVersionString},
    "@aws-cdk/assets": ${supportedCdkVersionString},
    "@aws-cdk/aws-kms": ${supportedCdkVersionString},
    "@aws-cdk/aws-ec2": ${supportedCdkVersionString},
    "@aws-cdk/aws-rds": ${supportedCdkVersionString},
    "@aws-cdk/aws-ssm": ${supportedCdkVersionString},
    "@aws-cdk/core": ${supportedCdkVersionString}`

try {
  const installedCdkVersion = JSON.parse(fs.readFileSync(`${require.resolve('aws-cdk').replace('index.js', '')}/../package.json`).toString()).version
  if (supportedCdkVersion !== installedCdkVersion) {
    console.log(`
  ${colors.bold.green('Thanks for using Mira!')}
  It looks like you have ${installedCdkVersion} version of aws-cdk installed, but ${supportedCdkVersion} is required.
  ${mandatoryDepsMessage} 
  `)
  } else {
    console.log(`
    ${colors.bold.green('Thanks for using Mira!')}
    Currently supported version of the AWS CDK is: ${colors.bold.grey.black.blue(supportedCdkVersion)}
    ${mandatoryDepsMessage}
    `)
  }
} catch (err) {
  console.log(`
  ${colors.bold.green('Thanks for using Mira!')}
  ${colors.red('It looks you have no aws-cdk installed.')}
  ${mandatoryDepsMessage} 
  `)
}
