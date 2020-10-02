"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const healthy_config_json_1 = __importDefault(require("./__mocks__/healthy-config.json"));
const config_1 = __importDefault(require("config"));
const job_config_1 = __importDefault(require("./job-config"));
jest.mock('config');
jest.mock('os', () => ({ userInfo: () => ({ username: 'BobPC' }) }));
const profiles = {
    'company-dev': { credentials: { roleArn: 'arn:aws:iam::111111111111:role/CompanyDev-AdminAccess' }, region: 'eu-west-1' },
    'company-prd': { credentials: { roleArn: 'arn:aws:iam::222222222222:role/CompanyProd-AdminAccess' }, region: 'eu-west-1' },
    'company-domain': { credentials: { roleArn: 'arn:aws:iam::333333333333:role/CompanyDomain-AdminAccess' }, region: 'eu-west-1' }
};
jest.mock('aws-sdk', () => ({
    SharedIniFileCredentials: jest.fn(),
    Config: jest.fn().mockImplementation(() => {
        const profile = process.env.AWS_PROFILE || '';
        return lodash_1.default.cloneDeep(profiles[profile]);
    })
}));
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockConfigHandler = (mockConfig) => {
    config_1.default.get = (key) => lodash_1.default.get(mockConfig, key);
    config_1.default.has = (key) => lodash_1.default.has(mockConfig, key);
};
describe('MiraJobConfig', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Healthy input', () => {
        it('Handles {environment} deployment', () => {
            let jobConfig;
            mockConfigHandler(healthy_config_json_1.default);
            jobConfig = new job_config_1.default('deploy', 'Staging');
            expect(jobConfig).toEqual({
                deployment: 'Application',
                environment: 'Staging',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-Staging',
                    isDeveloperMode: false,
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    network: {
                        withDomain: true,
                        baseDomain: 'company.com',
                        webAppUrl: 'staging.company.com',
                        parameterPrefix: '/company/product/staging'
                    },
                    requireManualApproval: false
                }
            });
            jobConfig = new job_config_1.default('deploy', 'Production');
            expect(jobConfig).toEqual({
                deployment: 'Application',
                environment: 'Production',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-Production',
                    isDeveloperMode: false,
                    role: {
                        profile: 'company-prd',
                        account: '222222222222',
                        region: 'eu-west-1'
                    },
                    network: {
                        withDomain: true,
                        baseDomain: 'company.com',
                        webAppUrl: 'company.com',
                        parameterPrefix: '/company/product/production'
                    },
                    requireManualApproval: true
                }
            });
        });
        it('Handles Developer deployment', () => {
            mockConfigHandler(healthy_config_json_1.default);
            let jobConfig;
            jobConfig = new job_config_1.default('deploy', 'Developer');
            expect(jobConfig).toEqual({
                deployment: 'Application',
                environment: 'Developer',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-BobPc',
                    isDeveloperMode: true,
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    network: {
                        withDomain: true,
                        baseDomain: 'company.com',
                        webAppUrl: 'company-product-bobpc.company.com',
                        parameterPrefix: '/company/product/bobpc'
                    },
                    requireManualApproval: false
                }
            });
            const webAppUrlConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete webAppUrlConfig.environments.Developer.baseDomain;
            webAppUrlConfig.environments.Developer.webAppUrl = 'custom.company.com';
            mockConfigHandler(webAppUrlConfig);
            jobConfig = new job_config_1.default('deploy', 'Developer');
            expect(jobConfig).toEqual({
                deployment: 'Application',
                environment: 'Developer',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-BobPc',
                    isDeveloperMode: true,
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    network: {
                        withDomain: true,
                        baseDomain: 'company.com',
                        webAppUrl: 'custom.company.com',
                        parameterPrefix: '/company/product/bobpc'
                    },
                    requireManualApproval: false
                }
            });
        });
        it('Handles CICD deployment', () => {
            mockConfigHandler(healthy_config_json_1.default);
            let jobConfig;
            jobConfig = new job_config_1.default('cicd');
            expect(jobConfig).toEqual({
                deployment: 'CICD',
                environment: 'Global',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-Cicd',
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    repo: {
                        name: 'Company-Product-Repository',
                        provider: 'github',
                        url: 'https://github.com/company/product',
                        branch: 'master',
                        gitHubTokenSecretArn: 'arn:aws:secretsmanager:eu-west-1:111111111111:secret:GitHubToken-VqjNoC',
                        codeCommitUserPublicKey: ''
                    },
                    buildspecFilename: 'infra/buildspec.yaml',
                    steps: [
                        {
                            stackName: 'Company-Product-Staging',
                            isDeveloperMode: false,
                            role: {
                                profile: 'company-dev',
                                account: '111111111111',
                                region: 'eu-west-1'
                            },
                            network: {
                                withDomain: true,
                                baseDomain: 'company.com',
                                webAppUrl: 'staging.company.com',
                                parameterPrefix: '/company/product/staging'
                            },
                            requireManualApproval: false
                        },
                        {
                            stackName: 'Company-Product-Production',
                            isDeveloperMode: false,
                            role: {
                                profile: 'company-prd',
                                account: '222222222222',
                                region: 'eu-west-1'
                            },
                            network: {
                                withDomain: true,
                                baseDomain: 'company.com',
                                webAppUrl: 'company.com',
                                parameterPrefix: '/company/product/production'
                            },
                            requireManualApproval: true
                        }
                    ]
                }
            });
            const codeCommitConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            codeCommitConfig.cicd.source = 'codecommit';
            const githubKey = 'github_token_secret_arn';
            const codeCommitKey = 'codecommit_public_key';
            codeCommitConfig.cicd[githubKey] = '';
            codeCommitConfig.cicd[codeCommitKey] = 'foo';
            mockConfigHandler(codeCommitConfig);
            jobConfig = new job_config_1.default('cicd');
            expect(jobConfig).toEqual({
                deployment: 'CICD',
                environment: 'Global',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-Cicd',
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    repo: {
                        name: 'Company-Product-Repository',
                        provider: 'codecommit',
                        url: 'https://github.com/company/product',
                        branch: 'master',
                        gitHubTokenSecretArn: '',
                        codeCommitUserPublicKey: 'foo'
                    },
                    buildspecFilename: 'infra/buildspec.yaml',
                    steps: [
                        {
                            stackName: 'Company-Product-Staging',
                            isDeveloperMode: false,
                            role: {
                                profile: 'company-dev',
                                account: '111111111111',
                                region: 'eu-west-1'
                            },
                            network: {
                                withDomain: true,
                                baseDomain: 'company.com',
                                webAppUrl: 'staging.company.com',
                                parameterPrefix: '/company/product/staging'
                            },
                            requireManualApproval: false
                        },
                        {
                            stackName: 'Company-Product-Production',
                            isDeveloperMode: false,
                            role: {
                                profile: 'company-prd',
                                account: '222222222222',
                                region: 'eu-west-1'
                            },
                            network: {
                                withDomain: true,
                                baseDomain: 'company.com',
                                webAppUrl: 'company.com',
                                parameterPrefix: '/company/product/production'
                            },
                            requireManualApproval: true
                        }
                    ]
                }
            });
        });
        it('Handles DomainManager deployment', () => {
            mockConfigHandler(healthy_config_json_1.default);
            const jobConfig = new job_config_1.default('domain');
            expect(jobConfig).toEqual({
                deployment: 'DomainManager',
                environment: 'Global',
                target: 'Company-Product',
                details: {
                    stackName: 'Company-Product-DomainManager',
                    role: {
                        profile: 'company-dev',
                        account: '111111111111',
                        region: 'eu-west-1'
                    },
                    hostedZoneId: 'Z2DHU1GXEKO5Q6'
                }
            });
        });
    });
    describe('Corrupt input', () => {
        it('Handles {environment} deployment', () => {
            mockConfigHandler(healthy_config_json_1.default);
            expect(() => new job_config_1.default('deploy')).toThrowError('Cannot deploy environment undefined');
            expect(() => new job_config_1.default('')).toThrowError('Cannot resolve deployment type');
            let brokenConfig;
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Staging')).toThrowError('Missing config.environments');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Staging;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Staging')).toThrowError('Cannot find config for environment Staging');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Staging.profile;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Staging')).toThrowError('AWS profile undefined is missing role_arn or region information');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Staging.withDomain;
            mockConfigHandler(brokenConfig);
            expect((new job_config_1.default('deploy', 'Staging')).details.network.withDomain).toEqual(false);
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Staging.webAppUrl;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Staging')).toThrowError('No webAppUrl set for Staging');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            brokenConfig.environments.Staging.baseDomain = 'company.com';
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Staging')).toThrowError('Cannot specify baseDomain when already given webAppUrl for Staging');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Staging.requireManualApproval;
            mockConfigHandler(brokenConfig);
            expect((new job_config_1.default('deploy', 'Staging')).details.requireManualApproval).toEqual(false);
        });
        it('Handles Developer deployment', () => {
            let brokenConfig;
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Developer')).toThrowError('Missing config.environments');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Developer;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Developer')).toThrowError('Cannot find config for environment Developer');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Developer.profile;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Developer')).toThrowError('AWS profile undefined is missing role_arn or region information');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Developer.withDomain;
            mockConfigHandler(brokenConfig);
            expect((new job_config_1.default('deploy', 'Developer')).details.network.withDomain).toEqual(false);
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.environments.Developer.baseDomain;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Developer')).toThrowError('No baseDomain set for Developer');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            brokenConfig.environments.Developer.webAppUrl = 'company.com';
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('deploy', 'Developer')).toThrowError('Cannot specify baseDomain when already given webAppUrl for Developer');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            mockConfigHandler(brokenConfig);
            expect((new job_config_1.default('deploy', 'Developer')).details.requireManualApproval).toEqual(false);
        });
        it('Handles CICD deployment', () => {
            let brokenConfig;
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.profile;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('AWS profile undefined is missing role_arn or region information');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.buildspec_file;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.buildspec_file');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.source;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Could not determine repository provider');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            brokenConfig.cicd.source = 'github';
            delete brokenConfig.cicd.github_token_secret_arn;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.github_token_secret_arn');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            brokenConfig.cicd.source = 'codecommit';
            delete brokenConfig.cicd.codecommit_public_key;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.codecommit_public_key');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.repository_url;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.repository_url');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.branch_name;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.branch_name');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.cicd.steps;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('cicd')).toThrowError('Missing config.cicd.steps');
        });
        it('Handles DomainManager deployment', () => {
            let brokenConfig;
            process.argv = ['npx', 'mira', 'domain'];
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.domain;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('domain')).toThrowError('Missing config.domain');
            brokenConfig = lodash_1.default.cloneDeep(healthy_config_json_1.default);
            delete brokenConfig.domain.hostedZoneId;
            mockConfigHandler(brokenConfig);
            expect(() => new job_config_1.default('domain')).toThrowError('Missing config.domain.hostedZoneId');
        });
    });
});
//# sourceMappingURL=job-config.test.js.map