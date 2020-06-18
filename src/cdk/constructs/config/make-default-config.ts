import chalk from 'chalk'
import * as inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'
import { buildSearchRegions } from './autocomplete'
import * as validators from './validators'

const configDirPath = 'config'

function createDefaultJSON (config: object): void {
  try {
    if (!fs.existsSync(configDirPath)) {
      fs.mkdirSync(configDirPath)
    }
    const json: string = JSON.stringify(config, null, 2)
    const defaultFilePath = `${configDirPath}${path.sep}default.json`
    fs.writeFileSync(`${configDirPath}${path.sep}default.json`, json)
    console.log(chalk.whiteBright(`Successfully created ${defaultFilePath}`))
  } catch (error) {
    console.log(chalk.red('Could not create configuration directory.'))
    process.exit(-1)
  }
}

export default async function configWizard (): Promise<void> {
  console.log()
  console.log(chalk.white('This utility will walk you through creating a default.json file.'))
  console.log()
  console.log(chalk.white('Please consult the Mira documentation for definitive documentation'))
  console.log(chalk.white('on these fields and exactly what they do.\n'))
  console.log(chalk.white('Press ^C at any time to quit.\n'))

  type Answers = {
    name: string
    prefix: string
    account: string
    region: string
    profile: string
  }

  const answers = await inquirer
    .prompt<Answers>([
      {
        name: 'name',
        message: 'Application Name?',
        validate: (name: string): boolean => name.length > 0
      },
      {
        name: 'prefix',
        message: 'Application Prefix?',
        validate: (prefix: string): boolean => prefix.length > 0
      },
      {
        name: 'account',
        message: 'CI/CD Environment AWS Account ID?',
        validate: validators.isValidAwsAccountId
      },
      {
        type: 'autocomplete',
        name: 'region',
        source: buildSearchRegions(),
        message: 'CI/CD Environment AWS Account Region?'
      },
      {
        name: 'profile',
        message: 'CI/CD Environment local AWS CLI configuration profile name?',
        validate: validators.isValidAwsCliProfile
      }
    ])

  const { account, region, name, prefix, profile } = answers
  const config: object = {
    account,
    region,
    app: {
      name,
      prefix
    },
    profile
  }

  createDefaultJSON(config)
}
