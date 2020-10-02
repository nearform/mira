"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    'app.prefix': 'John',
    'app.name': 'My Great App',
    profile: true,
    cicd: {
        repositoryUrl: 'https://github.com/nearform/mira',
        codeCommitUserPublicKey: 'ssh-rsa ...',
        provider: 'codecommit'
    },
    'cicd.target': 'cicd',
    'cicd.stages': [
        {
            target: 'staging',
            withDomain: false,
            requireManualApproval: false
        }
    ],
    accounts: true,
    'accounts.cicd': {
        env: {
            account: 'ACCOUNT_NUMER',
            region: 'REGION'
        },
        profile: 'mira-dev'
    },
    'accounts.staging': {
        env: {
            account: 'ACCOUNT_NUMER',
            region: 'REGION'
        },
        profile: 'mira-dev'
    }
};
const configMock = {
    get(setting) {
        return config[setting];
    },
    has(setting) {
        return setting in config;
    },
    util: {
        loadFileConfigs() {
            return {
                app: {
                    name: 'S3Webhosting',
                    prefix: 'Nf'
                },
                dev: {
                    target: 'default'
                },
                accounts: {
                    default: {
                        name: 'hello',
                        profile: 'mira-dev',
                        env: {
                            account: '101259067028',
                            region: 'eu-west-1'
                        }
                    }
                }
            };
        }
    } // eslint-disable-line @typescript-eslint/no-explicit-any
};
/*
  The `any` type in the line above is required to accomplish the same value returned by
  the `loadFileConfigs` function in the `config` module
 */
exports.default = configMock;
//# sourceMappingURL=config.js.map