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
exports.MiraCiApp = void 0;
const cdk = __importStar(require("@aws-cdk/core"));
const cicd_1 = require("./constructs/cicd");
const aws = __importStar(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const mira_config_1 = require("../config/mira-config");
// eslint-disable-next-line
const minimist = require('minimist');
const args = minimist(process.argv);
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
class MiraCiApp {
    // eslint-disable-next-line
    constructor() {
        this.stacks = [];
        mira_config_1.MiraConfig.setDefaultEnvironmentName(args.env);
    }
    /**
     * Initializes the app and stack.
     */
    async initialize() {
        if (!this.cdkApp) {
            this.initializeApp();
        }
        const config = mira_config_1.MiraConfig.getCICDConfig();
        const callerIdentityResponse = await this.getCallerIdentityResponse(args.profile || config.account.profile);
        const envVars = this.parsePipelineEnvironmentVariables();
        new cicd_1.Cicd(this.cdkApp, {
            callerIdentityResponse,
            environmentVariables: envVars,
            env: config.account.env
        });
        if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
            this.cdkApp.synth();
        }
    }
    async getCallerIdentityResponse(profile) {
        aws.config.credentials = new aws.SharedIniFileCredentials({ profile });
        const sts = new aws.STS();
        const callerIdentityResponse = await sts.getCallerIdentity().promise();
        return callerIdentityResponse;
    }
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp() {
        this.cdkApp = new cdk.App();
    }
    parsePipelineEnvironmentVariables() {
        let output = [];
        if (args.envVar) {
            output = args.envVar
                .split(',')
                .map((keyValue) => {
                const [key, value] = keyValue.split('=');
                return { key, value };
            });
        }
        return output;
    }
}
exports.MiraCiApp = MiraCiApp;
if (args._[1].match(/ci-app.js$/).length > 0) {
    // Ensure we're within a CDK deploy context.
    console.info(`>>> ${chalk_1.default
        .yellow('Initializing CDK for CI')}:\n    ${chalk_1.default.grey(args.stack)}`);
    const app = new MiraCiApp();
    app.initialize();
}
//# sourceMappingURL=ci-app.js.map