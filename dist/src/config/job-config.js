"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const change_case_1 = require("change-case");
const config_1 = __importDefault(require("config"));
const utils_1 = require("./utils");
/** @ignore - Excluded from documentation generation. */
var Deployment;
(function (Deployment) {
    Deployment["CICD"] = "CICD";
    Deployment["DomainManager"] = "DomainManager";
    Deployment["Application"] = "Application";
})(Deployment || (Deployment = {}));
/**
 * Stores all the required data for one self-contained deployment job
 */
class MiraConfig {
    constructor(deploymentCmd = 'deploy', environment) {
        switch (deploymentCmd) {
            case 'deploy':
                this.deployment = Deployment.Application;
                if (!environment) {
                    throw new Error('Cannot deploy environment undefined');
                }
                this.environment = environment;
                break;
            case 'cicd':
                this.deployment = Deployment.CICD;
                this.environment = 'Global';
                break;
            case 'domain':
                this.deployment = Deployment.DomainManager;
                this.environment = 'Global';
                break;
            default:
                throw new Error('Cannot resolve deployment type');
        }
        const appPrefix = config_1.default.get('app.prefix');
        const appName = change_case_1.pascalCase(config_1.default.get('app.name'));
        this.target = utils_1.nameResource(appPrefix, appName);
        const deploymentSuffix = this.environment !== 'Global' ? this.environment : this.deployment;
        const deploymentStackName = utils_1.nameResource(appPrefix, appName, deploymentSuffix);
        const massageEnvData = (envData, isDeveloperMode) => {
            const environmentSuffix = isDeveloperMode ? change_case_1.pascalCase(os_1.userInfo().username) : envData.name;
            const environmentStackName = utils_1.nameResource(appPrefix, appName, environmentSuffix);
            return {
                stackName: environmentStackName,
                isDeveloperMode,
                role: utils_1.loadAWSProfile(envData.profile),
                network: {
                    withDomain: !!envData.withDomain,
                    ...utils_1.getUrl(envData, isDeveloperMode, environmentStackName),
                    parameterPrefix: `/${appPrefix}/${appName}/${environmentSuffix}`.toLowerCase()
                },
                requireManualApproval: !!envData.requireManualApproval
            };
        };
        switch (this.deployment) {
            case Deployment.CICD: {
                for (const key of ['cicd', 'cicd.repository_url', 'cicd.branch_name', 'cicd.buildspec_file', 'cicd.steps']) {
                    let value = config_1.default.get(key);
                    if (typeof value === 'string')
                        value = value.trim();
                    if (!value) {
                        throw new Error('Missing config.' + key);
                    }
                }
                const repo = {
                    name: utils_1.nameResource(appPrefix, appName, 'Repository'),
                    provider: config_1.default.get('cicd.source'),
                    url: config_1.default.get('cicd.repository_url'),
                    branch: config_1.default.get('cicd.branch_name'),
                    gitHubTokenSecretArn: config_1.default.get('cicd.github_token_secret_arn'),
                    codeCommitUserPublicKey: config_1.default.get('cicd.codecommit_public_key')
                };
                // Check repository provider
                switch (repo.provider) {
                    case 'github':
                        if (!(repo.gitHubTokenSecretArn || '').trim()) {
                            throw new Error('Missing config.cicd.github_token_secret_arn');
                        }
                        break;
                    case 'codecommit':
                        if (!(repo.codeCommitUserPublicKey || '').trim()) {
                            throw new Error('Missing config.cicd.codecommit_public_key');
                        }
                        break;
                    default:
                        throw new Error('Could not determine repository provider');
                }
                const stepKeys = config_1.default.get('cicd.steps') || [];
                const steps = stepKeys.map((envKey) => {
                    const envData = utils_1.loadEnvironment(envKey);
                    return massageEnvData(envData, false);
                });
                const details = {
                    stackName: deploymentStackName,
                    role: utils_1.loadAWSProfile(config_1.default.get('cicd.profile')),
                    repo,
                    buildspecFilename: config_1.default.get('cicd.buildspec_file'),
                    steps
                };
                this.details = details;
                break;
            }
            case Deployment.Application: {
                const isDeveloperMode = this.environment === 'Developer';
                const envData = utils_1.loadEnvironment(this.environment);
                this.details = massageEnvData(envData, isDeveloperMode);
                break;
            }
            case Deployment.DomainManager: {
                const envData = config_1.default.get('domain');
                if (!envData) {
                    throw new Error('Missing config.domain');
                }
                if (!envData.hostedZoneId) {
                    throw new Error('Missing config.domain.hostedZoneId');
                }
                const details = {
                    stackName: deploymentStackName,
                    role: utils_1.loadAWSProfile(config_1.default.get('cicd.profile')),
                    hostedZoneId: envData.hostedZoneId
                };
                this.details = details;
                break;
            }
        }
    }
}
exports.default = MiraConfig;
//# sourceMappingURL=job-config.js.map