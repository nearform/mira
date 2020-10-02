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
exports.MiraApp = void 0;
const cdk = __importStar(require("@aws-cdk/core"));
const chalk_1 = __importDefault(require("chalk"));
const stack_1 = require("./stack");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./constructs/config/utils");
const mira_config_1 = require("../config/mira-config");
// eslint-disable-next-line
const minimist = require("minimist");
const args = minimist(process.argv);
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
class MiraApp {
    // eslint-disable-next-line
    constructor() {
        this.stacks = [];
        mira_config_1.MiraConfig.setDefaultEnvironmentName(args.env);
    }
    /**
     * Load a single stack given the filename
     * @param {String} fileName (Optional) Can provide an arbitary name to
     * lookup if name exists in configs.
     */
    async getStack(fileName) {
        const stackFile = path.resolve(fileName);
        if (!fs.existsSync(stackFile)) {
            return false;
        }
        const stackImport = await Promise.resolve().then(() => __importStar(require(stackFile)));
        return stackImport.default;
    }
    /**
     * Loads the stacks
     * @param {String} stackName (Optional) Can provide an arbitary name to
     * lookup if name exists in configs.
     */
    async getStacks() {
        const stacks = [];
        for (const fileName of MiraApp.getStackFiles()) {
            const stack = await this.getStack(fileName);
            if (!stack) {
                throw new Error(`The stack file ${fileName} doesn't exist`);
            }
            stacks.push(stack);
        }
        return stacks;
    }
    /**
     * Gets the stack file from CLI.
     */
    static getStackFiles() {
        if (Array.isArray(args.file)) {
            return args.file;
        }
        return args.file.split(',');
    }
    /**
     * Gets the stack name from CLI.
     */
    static getStackName() {
        return args.stack || 'default';
    }
    static getBaseStackName(suffix) {
        return utils_1.getBaseStackName(suffix);
    }
    static getBaseStackNameFromParams(prefix, name, suffix) {
        return utils_1.getBaseStackNameFromParams(prefix, name, suffix);
    }
    /**
     * Initializes the app and stack.
     */
    async initialize() {
        if (!this.cdkApp) {
            this.initializeApp();
        }
        const Stacks = await this.getStacks();
        if (!Stacks.length) {
            console.warn('No stack found when initializing, please use the ' +
                '--stack=[StackName] flag ' +
                'when running this script.');
        }
        try {
            const initializationList = [];
            if (Stacks[0].prototype instanceof stack_1.MiraStack) {
                const serviceStack = new stack_1.MiraServiceStack(this, args.env);
                initializationList.push(serviceStack.initialized);
                for (const Stack of Stacks) {
                    const stack = new Stack(serviceStack);
                    if (!stack.props.disablePolicies) {
                        serviceStack.applyPolicies(stack.props.approvedWildcardActions);
                    }
                    initializationList.push(stack.initialized);
                }
            }
            else if (Stacks[0].prototype instanceof stack_1.MiraServiceStack) {
                for (const Stack of Stacks) {
                    const stack = new Stack(this);
                    initializationList.push(stack.initialized);
                }
            }
            else {
                new Stacks[0](this.cdkApp, { env: args.env });
            }
            await Promise.all(initializationList);
            if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
                this.cdkApp.synth();
            }
        }
        catch (e) {
            console.error(chalk_1.default.red('Failed:'), 'could not deploy the stack', e);
            process.exit(1);
        }
    }
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp() {
        this.cdkApp = new cdk.App();
    }
    static isVerbose() {
        return MiraApp.cliArgs.verbose && MiraApp.cliArgs.verbose !== 'false' &&
            MiraApp.cliArgs.verbose !== '0';
    }
}
exports.MiraApp = MiraApp;
MiraApp.cliArgs = args;
// Ensure we're within a CDK deploy context.
// TODO: This check is here to avoid that the deploy starts even
// when we want to deploy CICD or Domain Manager, since this file
// is imported this code below will run. I check that the command is
// executed with 'app.js' file as argument and nod 'ci-app.js' or 'domain.js'
if (args._.filter((arg) => arg.match(/app.js$/)).length > 0) {
    console.info(`>>> ${chalk_1.default.yellow('Initializing CDK for App')}: ${chalk_1.default.grey(args.file)}`);
    const app = new MiraApp();
    app.initialize();
}
//# sourceMappingURL=app.js.map