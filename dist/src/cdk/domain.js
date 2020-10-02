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
exports.MiraDomainApp = void 0;
const cdk = __importStar(require("@aws-cdk/core"));
const certificate_manager_1 = require("./constructs/domain/certificate-manager");
const route53_manager_1 = require("./constructs/domain/route53-manager");
const route53_manager_access_role_1 = require("./constructs/domain/route53-manager-access-role");
const mira_config_1 = require("../config/mira-config");
const chalk_1 = __importDefault(require("chalk"));
const minimist_1 = __importDefault(require("minimist"));
const app_1 = require("./app");
const args = minimist_1.default(process.argv);
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
class MiraDomainApp extends app_1.MiraApp {
    constructor() {
        super();
        mira_config_1.MiraConfig.setDefaultEnvironmentName(args.env);
    }
    /**
     * Initializes the app and stack.
     */
    async initialize() {
        if (!this.cdkApp) {
            this.initializeApp();
        }
        const stack = new cdk.Stack(this.cdkApp, mira_config_1.MiraConfig.getBaseStackName('DomainManager'), {});
        new certificate_manager_1.CertificateManager(stack);
        new route53_manager_1.Route53Manager(stack);
        new route53_manager_access_role_1.Route53ManagerAccessRoleStack(stack);
        if (!Object.prototype.hasOwnProperty.call(args, 'dry-run')) {
            this.cdkApp.synth();
        }
    }
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp() {
        this.cdkApp = new cdk.App();
    }
}
exports.MiraDomainApp = MiraDomainApp;
if (args.stack) {
    // Ensure we're within a CDK deploy context.
    console.info(`>>> ${chalk_1.default
        .yellow('Initializing CDK for DomainManager')}:\n    ${chalk_1.default.grey(args.stack)}`);
    const app = new MiraDomainApp();
    app.initialize();
}
//# sourceMappingURL=domain.js.map