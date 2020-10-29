import { MiraConfig, Account } from '../config/mira-config'

/** @ignore - Excluded from documentation generation. */
// eslint-disable-next-line
const minimist = require('minimist')

/** @ignore - Excluded from documentation generation. */
const args = minimist(process.argv.slice(2))

/**
 * @class Responsible for establishing the Mira environment.  This includes
 * assisting with the bootstrapping process (reading and parsing CLI args) and
 * the local system configuration including AWS credentials.
 */
export default class MiraEnv {
    env: Account
    /* eslint-disable-next-line */
    args: any
    static instance: MiraEnv
    constructor () {
      this.initialize()
      if (!MiraEnv.instance) {
        MiraEnv.instance = this
      } if (args.env !== 'test') {
        console.warn('MiraEnv was instantiated twice outside a testing environment' +
              '.  This will likely cause unknown behavior.')
      }
    }

    initialize (): void {
      this.parseFile()
      this.parseEnv()
      this.args = args
    }

    /**
 * Parses the environment variable.
 */
    parseEnv (): Account {
      if (!args.env && process.env.NODE_ENV) {
        args.env = 'dev' // process.env.NODE_ENV
      } else if (!args.env) {
        console.warn('Warning: Environment not specified, defauling to dev.')
        args.env = 'dev'
      }
      // TODO: Perhaps we migrate this fn to this class?
      this.env = MiraConfig.getEnvironment(args.env)
      return this.env
    }

    /**
     * Parses the file variable.
     */
    parseFile (): string {
      if (!args.file && process.env.NODE_ENV !== 'test') {
        console.warn('You must specify a --file argument when using the ' +
                'deploy or undeploy command within mira.')
        // TODO: Specify exit code.
        process.exit(1)
      } else if (!args.file && process.env.NODE_ENV === 'test') {
        args.file = ''
      }
      if (Array.isArray(args.file)) {
        return args.file
      }
      return args.file.split(',')
    }
}
new MiraEnv()
