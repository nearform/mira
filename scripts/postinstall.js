// eslint-disable-next-line
const colors = require('colors')
// eslint-disable-next-line
const fs = require('fs')

const supportedCdkVersion = '"1.49.1"'

const mandatoryDepsMessage = `
Please make sure to to include the following dependencies to you project:
    "aws-cdk": ${supportedCdkVersion},
    "@aws-cdk/aws-cloudformation": ${supportedCdkVersion},
    "@aws-cdk/aws-codebuild": ${supportedCdkVersion},
    "@aws-cdk/aws-codecommit": ${supportedCdkVersion},
    "@aws-cdk/aws-codepipeline": ${supportedCdkVersion},
    "@aws-cdk/aws-codepipeline-actions": ${supportedCdkVersion},
    "@aws-cdk/aws-iam": ${supportedCdkVersion},
    "@aws-cdk/aws-lambda-event-sources": ${supportedCdkVersion},
    "@aws-cdk/aws-lambda": ${supportedCdkVersion},
    "@aws-cdk/aws-s3-assets": ${supportedCdkVersion},
    "@aws-cdk/aws-secretsmanager": ${supportedCdkVersion},
    "@aws-cdk/custom-resources": ${supportedCdkVersion},
    "@aws-cdk/aws-sns": ${supportedCdkVersion},
    "@aws-cdk/aws-s3": ${supportedCdkVersion},
    "@aws-cdk/aws-sqs": ${supportedCdkVersion},
    "@aws-cdk/assets": ${supportedCdkVersion},
    "@aws-cdk/aws-kms": ${supportedCdkVersion},
    "@aws-cdk/aws-ec2": ${supportedCdkVersion},
    "@aws-cdk/aws-rds": ${supportedCdkVersion},
    "@aws-cdk/aws-ssm": ${supportedCdkVersion},
    "@aws-cdk/core": ${supportedCdkVersion}`

try {
  const installedCdkVersion = JSON.parse(fs.readFileSync(`${require.resolve('aws-cdk').replace('index.js', '')}/../package.json`).toString()).version
  if (supportedCdkVersion !== installedCdkVersion) {
    console.log(`
  ${colors.bold.green('Thanks for using Mira!')}
  It looks you have ${installedCdkVersion} version of aws-cdk installed, but ${supportedCdkVersion} is required.
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
