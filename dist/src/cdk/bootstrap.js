"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiraBootstrap = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const app_1 = require("./app");
const mira_config_1 = require("../config/mira-config");
const make_default_config_1 = __importDefault(require("./constructs/config/make-default-config"));
const assume_role_1 = require("../assume-role");
const yargs_1 = __importDefault(require("yargs"));
const transpiler_1 = __importDefault(require("../transpiler"));
const JsonValidation = __importStar(require("../jsonvalidator"));
const config_1 = __importDefault(require("config"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const change_detector_1 = __importDefault(require("../change-detector"));
const error_logger_1 = __importDefault(require("../error-logger"));
const deploy_buckets_1 = require("./deploy-buckets");
/**
 * @class Responsible for beaming up bits to AWS.  Teleportation device not
 * included.
 */
class MiraBootstrap {
    constructor() {
        this.cdkCommand = path_1.default.join(require.resolve('aws-cdk'), '..', '..', 'bin', 'cdk');
        this.docsifyCommand = path_1.default.join(require.resolve('docsify-cli'), '..', '..', 'bin', 'docsify');
        this.app = new app_1.MiraApp();
        this.errorLogger = new error_logger_1.default();
        this.spawn = child_process_1.spawn;
    }
    /**
     * Orchestration used for deployment of the given application. This is used whenever developer or CI will try to
     * deploy application. It is important to keep this function as a single place for application deployment so, development environment
     * will have the same deployment process as CI owned environments.
     *
     * @param undeploy
     */
    async deploy(undeploy = false) {
        const envConfig = mira_config_1.MiraConfig.getEnvironment(this.env);
        this.env = envConfig.name;
        if (this.args.role) {
            try {
                await assume_role_1.assumeRole(this.args.role);
            }
            catch (error) {
                console.warn(chalk_1.default.red('Error Assuming Role'), error.message);
                return;
            }
        }
        let cmd = 'deploy';
        if (undeploy) {
            cmd = 'destroy';
        }
        const additionalArgs = [];
        if (Object.keys(this.args).includes('outputs-file')) {
            additionalArgs.push(`--outputs-file=${this.args['outputs-file']}`);
            delete this.args['outputs-file'];
        }
        if (Object.keys(this.args).includes('stackName')) {
            additionalArgs.push(this.args.stackName);
            delete this.args.stackName;
        }
        if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run') ||
            Object.prototype.hasOwnProperty.call(this.args, 's3-only')) {
            deploy_buckets_1.removeAssetDirectories();
            cmd = 'synth';
        }
        const commandOptions = [
            this.cdkCommand,
            cmd,
            '--app', this.getCDKArgs('app.js'),
            envConfig.name ? `--env=${envConfig.name}` : '',
            this.env ? `--profile=${this.getProfile(this.env)}` : '',
            ...additionalArgs
        ];
        const proc = this.spawn('node', commandOptions, {
            stdio: 'inherit',
            env: {
                NODE_ENV: 'dev',
                ...process.env
            }
        });
        await new Promise((resolve) => {
            proc.on('exit', async (code) => {
                if (code !== 0) {
                    await this.printExtractedNestedStackErrors();
                }
                resolve();
            });
        });
        if (Object.prototype.hasOwnProperty.call(this.args, 's3-only')) {
            await deploy_buckets_1.quickDeploy();
        }
    }
    /**
     * Orchestration for `npx mira cicd` command. As an effect, CodePipeline and related services will be deployed together
     * with permission stacks deployed to the target accounts.
     */
    async deployCi() {
        const permissionFilePath = mira_config_1.MiraConfig.getPermissionsFilePath();
        if (!permissionFilePath) {
            console.error('Permissions file path must be specified either in cicd config or as --file parameter.');
            throw new Error('Permissions file path must be specified either in cicd config or as --file parameter.');
        }
        const ciTargetAccounts = mira_config_1.MiraConfig.getCICDAccounts();
        let cmd = 'deploy';
        if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
            cmd = 'synth';
        }
        for (const account of ciTargetAccounts) {
            const commandOptions = [
                this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
                cmd,
                '--app', this.getCDKArgs('app.js', true, account.name),
                account.name ? `--profile=${this.getProfile(account.name)}` : ''
            ];
            console.log(chalk_1.default.cyan(`Starting deployment of CI ${account.name} permissions to Account: ${account.env.account} in ${account.env.region} with profile ${account.profile}.`));
            const proc = this.spawn('node', commandOptions, {
                stdio: 'inherit',
                env: {
                    ...process.env
                }
            });
            await new Promise((resolve) => {
                proc.on('exit', () => {
                    resolve();
                });
            });
            console.log(chalk_1.default.green(`Done deploying CI ${account.name} permissions.`));
        }
        console.log(chalk_1.default.cyan(`Starting deployment of CI pipeline to Account: ${mira_config_1.MiraConfig.getCICDConfig().account.env.account} in ${mira_config_1.MiraConfig.getCICDConfig().account.env.region} with profile ${mira_config_1.MiraConfig.getCICDConfig().account.profile}.`));
        const commandOptions = [
            this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
            cmd,
            '--app', this.getCDKArgs('ci-app.js'),
            `--profile=${this.getProfile('cicd')}`
        ];
        const proc = this.spawn('node', commandOptions, {
            stdio: 'inherit',
            env: {
                ...process.env
            }
        });
        await new Promise((resolve) => {
            proc.on('exit', () => {
                resolve();
            });
        });
        console.log(chalk_1.default.green('Done deploying CI pipeline.'));
    }
    /**
     * Runs docsify web server with the mira docs.
     */
    runDocs() {
        const commandOptions = [
            this.docsifyCommand + (process.platform === 'win32' ? '.cmd' : ''),
            'serve',
            path_1.default.join(__dirname, '..', '..', '..', 'docs')
        ];
        try {
            this.spawn('node', commandOptions, {
                stdio: 'inherit',
                env: {
                    ...process.env
                }
            });
        }
        catch (error) {
            console.error(error.message);
            process.exit(error.status);
        }
    }
    /**
     * TODO: check this functionality together with sample app that supports custom domain.
     */
    deployDomain() {
        const envConfig = mira_config_1.MiraConfig.getEnvironment(this.env);
        let cmd = 'deploy';
        if (Object.prototype.hasOwnProperty.call(this.args, 'dry-run')) {
            cmd = 'synth';
        }
        const commandOptions = [
            this.cdkCommand + (process.platform === 'win32' ? '.cmd' : ''),
            cmd,
            '--app', this.getCDKArgs('domain.js'),
            `--env=${envConfig.name}`,
            `--profile=${this.getProfile(this.env)}`
        ];
        try {
            this.spawn('node', commandOptions, {
                stdio: 'inherit',
                env: {
                    ...process.env
                }
            });
        }
        catch (error) {
            console.error(error.message);
            process.exit(error.status);
        }
    }
    /**
     * Gets the arguments parsed by the app file provided for the CDK CLI.
     * @param filename - main application file.
     * @param isCi - when "npx mira cicd" command is executed permissions file path is taken from the config.file, NOT from the CLI param.
     * @param env - name of current target environment where the stack with role is going to be deployed.
     */
    getCDKArgs(filename, isCi = false, env) {
        const resultedEnv = this.env || env;
        const q = process.platform === 'win32' ? '"' : '\'';
        let appPath = path_1.default.resolve(__dirname, filename);
        if (fs_1.default.existsSync('node_modules/mira')) {
            if (fs_1.default.lstatSync('node_modules/mira/dist').isSymbolicLink()) {
                // Mira has been locally linked.
                try {
                    fs_1.default.mkdirSync('node_modules/mira-bootstrap');
                }
                catch (e) {
                    // NOOP
                }
                fs_1.default.writeFileSync('node_modules/mira-bootstrap/bootstrap-app.js', 'require(\'mira/dist/src/cdk/app.js\')', 'utf8');
                appPath = 'node_modules/mira-bootstrap/bootstrap-app.js';
            }
        }
        let appArg = `${q}node --preserve-symlinks "${appPath}" `;
        // Still inside the quotes, explode the args.
        // appArg += this.getArgs().join(' ')
        appArg += this.stackFile ? ` --file=${this.stackFile}` : '';
        appArg += resultedEnv ? ` --env=${resultedEnv}` : '';
        appArg += isCi ? ` --file=${mira_config_1.MiraConfig.getPermissionsFilePath()}` : '';
        appArg += q; // End quote.
        return appArg;
    }
    /**
     * Gets the arguments for this stack. It has built-in support for osx/win support.
     */
    getArgs() {
        var _a;
        // eslint-disable-next-line no-useless-rename, @typescript-eslint/no-unused-vars
        const { _: _, ...args } = this.args;
        const newArgs = [];
        for (const key of Object.keys(args)) {
            if (((_a = args[key]) === null || _a === void 0 ? void 0 : _a.includes) && args[key].includes(' ')) {
                const q = process.platform !== 'win32' ? '\'' : '"';
                args[key] = q + args[key] + q;
            }
            else if (typeof args[key] === 'boolean') {
                newArgs.push(`--${key}`);
                continue;
            }
            newArgs.push(`--${key}`, args[key]);
        }
        return newArgs;
    }
    /**
     * Gets the profile given the env.
     */
    getProfile(environment) {
        // if we are in Codebuild environment, return 'client' which is the one set by assume-role
        if (process.env.CODEBUILD_CI) {
            return 'client';
        }
        const envConfig = mira_config_1.MiraConfig.getEnvironment(environment);
        if (envConfig) {
            return envConfig.profile;
        }
        if (this.profile) {
            return this.profile;
        }
    }
    /**
     * Verifies wether files provided in the CLI exists.
     */
    async areStackFilesValid() {
        let isValid = true;
        for (const stackName of [this.stackFile]) {
            if (!(await this.app.getStack(stackName))) {
                console.warn(chalk_1.default.yellow('Stack Not Found:'), stackName);
                isValid = false;
            }
        }
        return isValid;
    }
    /**
     * Function being called when CLI is invoked.
     */
    async initialize() {
        this.args = this.showHelp();
        this.env = this.args.env;
        this.profile = this.args.profile;
        if (Object.keys(this.args).includes('env')) {
            delete this.args.env;
        }
        const rawConfig = config_1.default.util.toObject();
        const cmd = this.args._[0];
        const cd = new change_detector_1.default(process.cwd());
        const filesChanged = await cd.run();
        let transpiledStackFile;
        switch (cmd) {
            case 'domain':
                this.deployDomain();
                break;
            case 'init':
                make_default_config_1.default();
                break;
            case 'deploy':
                if (!this.args.file) {
                    console.warn(chalk_1.default.red('Error Initializing'), 'Must supply' +
                        ' a --file=<stackFile> argument.');
                    return;
                }
                if (!JsonValidation.validateConfig(rawConfig)) {
                    console.warn(chalk_1.default.red('Error Initializing'), 'Invalid config file.');
                    return;
                }
                this.stackFile = this.args.file;
                // Check for file changes
                if (filesChanged || this.args.force) {
                    if (!this.args.file) {
                        console.warn(chalk_1.default.red('Error Initializing'), 'Must supply' +
                            ' a --file=<stackFile> argument.');
                        return;
                    }
                    transpiledStackFile = await this.transpile();
                    if (transpiledStackFile) {
                        this.stackFile = transpiledStackFile;
                        // take a new snapshot because file changed.
                        await cd.takeSnapshot(cd.defaultSnapshotFilePath);
                    }
                    if ((await this.areStackFilesValid())) {
                        console.info(chalk_1.default.cyan('Deploying Stack:'), `(via ${chalk_1.default.grey(this.stackFile)})`);
                        this.deploy();
                    }
                }
                else {
                    console.info(chalk_1.default.yellow('No file changed after last deploy. Skipping.'));
                }
                break;
            case 'undeploy':
                if (!this.args.file) {
                    console.warn(chalk_1.default.red('Error Initializing'), 'Must supply' +
                        ' a --file=<stackFile> argument.');
                    return;
                }
                this.stackFile = this.args.file;
                transpiledStackFile = await this.transpile();
                if (transpiledStackFile) {
                    this.stackFile = transpiledStackFile;
                }
                if ((await this.areStackFilesValid())) {
                    console.info(chalk_1.default.cyan('Undeploying Stack:'), `(via ${chalk_1.default.grey(this.stackFile)})`);
                    this.undeploy();
                }
                else {
                    console.info('If you want to undeploy a stack not contained' +
                        ' in your local filesystem, please use the AWS console' +
                        '  directly.');
                }
                break;
            case 'cicd':
                if (!JsonValidation.validateConfig(rawConfig)) {
                    console.warn(chalk_1.default.red('Error Initializing'), 'Invalid config file.');
                    return;
                }
                this.deployCi();
                break;
            case 'docs':
                this.runDocs();
                break;
            case 'clean':
                await this.errorLogger.cleanMessages();
                break;
            default:
                this.showHelp();
        }
    }
    /**
     * Shows help for the CDK.
     */
    showHelp() {
        return yargs_1.default // eslint-disable-line
            .scriptName('npx mira')
            .usage('Usage: npx mira COMMAND')
            .option('profile', { type: 'string', alias: 'p', desc: 'AWS profile name used for AWS CLI' })
            .command('deploy', 'Deploys given stack', yargs => yargs
            .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
            .command('undeploy', 'Un-Deploys given stack', yargs => yargs
            .option('file', { type: 'string', alias: 'f', desc: 'REQUIRED: Path to your stack file', requiresArg: true }))
            .command('cicd', 'Deploys CI/CD pipeline', yargs => yargs
            .option('file', { type: 'string', aliast: 'f', desc: 'Path to permissions stack file.' })
            .option('envVar', { type: 'string', desc: 'Environment variable passed into the code build' }))
            .command('docs', 'Starts local web server with documentation')
            .command('clean', 'Removes error log files')
            .help()
            .demandCommand()
            .argv;
    }
    /**
     * Undeploys a stack.  This calls deploy with the undeploy parameter.  The
     * only reason to do this is that both calls share almost identical code.
     */
    async undeploy() {
        return await this.deploy(true);
    }
    /**
     * Changes context to use dev config if available, and runs passed function.
     * Typical usecase for this function is to set Dev environment in the context of Mira executable.
     * In case of CDK executions 'dev' is set as NODE_ENV during spawn.
     * @param fn
     * @param params
     */
    useDevConfig(fn, params) {
        const tmpEnv = process.env.NODE_ENV || 'default';
        process.env.NODE_ENV = 'dev';
        const rsp = fn.apply(this, params);
        process.env.NODE_ENV = tmpEnv;
        return rsp;
    }
    getServiceStackName(account) {
        const tmpConfig = config_1.default.util.loadFileConfigs(path_1.default.join(process.cwd(), 'config'));
        return `${app_1.MiraApp.getBaseStackNameFromParams(tmpConfig.app.prefix, tmpConfig.app.name, 'Service')}-${account.name}`;
    }
    static getServiceStackName(account) {
        const tmpConfig = config_1.default.util.loadFileConfigs(path_1.default.join(process.cwd(), 'config'));
        return `${app_1.MiraApp.getBaseStackNameFromParams(tmpConfig.app.prefix, tmpConfig.app.name, 'Service')}-${account.name}`;
    }
    getAwsSdkConstruct(construct, account) {
        const credentials = new aws_sdk_1.default.SharedIniFileCredentials({ profile: this.getProfile(this.env) || '' });
        aws_sdk_1.default.config.credentials = credentials;
        // eslint-disable-next-line
        // @ts-ignore
        return new aws_sdk_1.default[construct]({ region: account.env.region });
    }
    async getFirstFailedNestedStackName(account, stackName) {
        var _a, _b;
        const cloudformation = this.getAwsSdkConstruct('CloudFormation', account);
        const events = await cloudformation.describeStackEvents({ StackName: stackName }).promise();
        return (_b = (_a = events.StackEvents) === null || _a === void 0 ? void 0 : _a.filter((event) => event.ResourceStatus === 'UPDATE_FAILED' || event.ResourceStatus === 'CREATE_FAILED')[0]) === null || _b === void 0 ? void 0 : _b.PhysicalResourceId;
    }
    async extractNestedStackError() {
        var _a;
        const account = mira_config_1.MiraConfig.getEnvironment(this.env);
        const stackName = this.useDevConfig(this.getServiceStackName, [account]);
        // Environment variable required to parse ~/.aws/config file with profiles.
        process.env.AWS_SDK_LOAD_CONFIG = '1';
        let events;
        try {
            const nestedStackName = await this.getFirstFailedNestedStackName(account, stackName);
            const cloudformation = this.getAwsSdkConstruct('CloudFormation', account);
            events = await cloudformation.describeStackEvents({ StackName: nestedStackName }).promise();
        }
        catch (e) {
            console.log(chalk_1.default.red('Error, while getting error message from cloudformation. Seems something is wrong with your configuration.'));
        }
        const output = (_a = events === null || events === void 0 ? void 0 : events.StackEvents) === null || _a === void 0 ? void 0 : _a.filter((event) => event.ResourceStatus === 'UPDATE_FAILED' || event.ResourceStatus === 'CREATE_FAILED');
        return output || [];
    }
    filterStackErrorMessages(errors) {
        const output = errors.filter((error) => {
            return error.ResourceStatusReason !== 'Resource creation cancelled';
        });
        return output;
    }
    formatNestedStackError(item) {
        return `\n* ${item.ResourceStatus} - ${item.LogicalResourceId}\nReason: ${item.ResourceStatusReason}\nTime: ${item.Timestamp}\n`;
    }
    async printExtractedNestedStackErrors() {
        const printCarets = (nb) => {
            return '^'.repeat(nb);
        };
        const failedResources = await this.extractNestedStackError();
        if (Array.isArray(failedResources)) {
            console.log(chalk_1.default.red('\n\nYour app failed deploying, one of your nested stacks have failed to create or update resources. See the list of failed resources below:'));
            const filteredMessages = this.filterStackErrorMessages(failedResources);
            filteredMessages.map((errorMessage) => {
                console.log(chalk_1.default.red(this.formatNestedStackError(errorMessage)));
            });
            this.errorLogger.flushMessages(filteredMessages.map(m => this.formatNestedStackError(m)));
            console.log(chalk_1.default.red(`\n\n${printCarets(100)}\nAnalyze the list above, to find why your stack failed deployment.`));
        }
    }
    async transpile() {
        if (this.stackFile.match(/.ts$/)) {
            const T = new transpiler_1.default(this.stackFile);
            const newFile = await T.run();
            return newFile;
        }
    }
}
exports.MiraBootstrap = MiraBootstrap;
//# sourceMappingURL=bootstrap.js.map