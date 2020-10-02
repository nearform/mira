"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiraConfig = void 0;
const config_1 = __importDefault(require("config"));
const change_case_1 = require("change-case");
const git_url_parse_1 = __importDefault(require("git-url-parse"));
/** @ignore - Excluded from documentation generation. */
// eslint-disable-next-line
const minimist = require('minimist');
/** @ignore - Excluded from documentation generation. */
const args = minimist(process.argv);
/**
 * A mapping of configuration properties and their expected keys within the JSON config.
 */
var CONFIG_KEYS;
(function (CONFIG_KEYS) {
    CONFIG_KEYS["CICD"] = "cicd";
    CONFIG_KEYS["ACCOUNTS"] = "accounts";
    CONFIG_KEYS["DEV"] = "dev";
    CONFIG_KEYS["STAGES"] = "stages";
    CONFIG_KEYS["TARGET"] = "target";
    CONFIG_KEYS["COST_CENTER"] = "costCenter";
})(CONFIG_KEYS || (CONFIG_KEYS = {}));
/**
 * Command line arguments that do not require a configuration file to run.
 * @internal
 * @ignore - Excluded from documentation generation.
 */
const whitelistedArgs = ['docs', 'init'];
/**
 * This class represents the loaded Mira Configuration as defined by default.json
 * and its overrides (dev.json).
 *
 * @class MiraConfigClass
 */
class MiraConfigClass {
    constructor() {
        try {
            this.projectName = change_case_1.pascalCase(config_1.default.get('app.name'));
            this.projectPrefix = change_case_1.pascalCase(config_1.default.get('app.prefix'));
        }
        catch (err) {
            if (!whitelistedArgs.includes(args._[2])) {
                console.warn(`${err.message}, you will not be able to deploy your app yet. `);
                throw err;
            }
        }
    }
    setDefaultEnvironmentName(name) {
        this.defaultEnvironmentName = name;
    }
    getEnvironment(name) {
        name = this.getTargetName(name);
        const output = this.getFullAccountProps(name);
        if (!output) {
            throw new Error(`Cannot find environment ${name}`);
        }
        return output;
    }
    getEnvironmentWithCiProps(name) {
        name = this.getTargetName(name);
        const output = this.getFullAccountProps(name);
        if (!output) {
            throw new Error(`Cannot find environment ${name}`);
        }
        const cicdKey = `${CONFIG_KEYS.CICD}.${CONFIG_KEYS.STAGES}`;
        const ciOutput = config_1.default
            .get(cicdKey)
            .find((ciProps) => ciProps.target === name);
        if (!output) {
            throw new Error(`Cannot find environment ${name}`);
        }
        return Object.assign({}, { account: output }, ciOutput);
    }
    getBaseStackName(suffix = '') {
        let output = `${this.projectPrefix}-${this.projectName}`;
        if (suffix) {
            output += `-${suffix}`;
        }
        return output;
    }
    calculateCertificateStackName() {
        return this.getBaseStackName('Domain');
    }
    calculateRepositoryName() {
        return this.getBaseStackName('Repository');
    }
    getCICDAccounts() {
        let output = [];
        const accountsPath = `${CONFIG_KEYS.CICD}.${CONFIG_KEYS.STAGES}`;
        if (config_1.default.has(accountsPath)) {
            output = (config_1.default.get(accountsPath) || [])
                .map((stage) => this.getEnvironment(stage.target));
        }
        return output;
    }
    getPermissionsFilePath() {
        return args.file || args.f || this.getCICDConfig().permissionsFile;
    }
    getCICDConfig() {
        const output = this.getFullCiProps(CONFIG_KEYS.CICD);
        const { name, owner } = git_url_parse_1.default(output.repositoryUrl);
        return {
            ...output,
            repositoryName: name,
            repositoryOwner: owner
        };
    }
    getDomainConfig() {
        if (config_1.default.has('domain')) {
            return config_1.default.get('domain');
        }
        throw new Error('Cannot find Domain configuration.');
    }
    getDomainAllowedPrincipals() {
        let output = [];
        if (config_1.default.has('domain.accounts')) {
            output = (config_1.default.get('domain.accounts') || [])
                .map((accountName) => this.getEnvironment(accountName));
        }
        return output;
    }
    calculateSharedResourceName(resource) {
        const env = this.getEnvironment();
        const prefix = this.getBaseStackName();
        return `${prefix}-${env.name}-${resource}`;
    }
    getFullCiProps(name) {
        if (!config_1.default.has(name))
            throw new Error(`Missing ${name} in the top level of config.`);
        if (!config_1.default.has(`${name}.${CONFIG_KEYS.TARGET}`))
            throw new Error(`Missing ${CONFIG_KEYS.TARGET} name in the ${name} configuration.`);
        const envKey = config_1.default.get(`${name}.${CONFIG_KEYS.TARGET}`);
        if (!config_1.default.has(`${CONFIG_KEYS.ACCOUNTS}.${envKey}`)) {
            throw new Error(`Target named: ${envKey} is not defined in the accounts section of the configuration file. Check if you did not override accounts in dev.json file.`);
        }
        const account = config_1.default.get(`${CONFIG_KEYS.ACCOUNTS}.${envKey}`);
        return Object.assign({}, config_1.default.get(name), { account });
    }
    getFullAccountProps(name) {
        const accountsKey = CONFIG_KEYS.ACCOUNTS;
        if (!config_1.default.has(accountsKey))
            throw new Error(`Missing ${accountsKey} section in your configuration file`);
        if (!config_1.default.has(`${accountsKey}.${name}`))
            throw new Error(`Missing ${accountsKey}.${name} section in your configuration file`);
        return Object.assign({}, config_1.default.get(`${accountsKey}.${name}`), { name });
    }
    getTargetName(name) {
        const devTargetPath = `${CONFIG_KEYS.DEV}.${CONFIG_KEYS.TARGET}`;
        if (!name) {
            if (!config_1.default.has(devTargetPath)) {
                throw new Error(`Missing ${devTargetPath} in your config file.`);
            }
            name = config_1.default.get(devTargetPath) || '';
        }
        return name;
    }
    getCostCenter() {
        if (config_1.default.has(CONFIG_KEYS.COST_CENTER)) {
            return config_1.default.get(CONFIG_KEYS.COST_CENTER);
        }
        return '';
    }
}
exports.MiraConfig = new MiraConfigClass();
//# sourceMappingURL=mira-config.js.map