"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const core_1 = require("@aws-cdk/core");
const aws_sns_1 = require("@aws-cdk/aws-sns");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_lambda_event_sources_1 = require("@aws-cdk/aws-lambda-event-sources");
const mira_config_1 = require("../../../../config/mira-config");
jest.mock('@aws-cdk/aws-iam', () => ({
    ...jest.requireActual('@aws-cdk/aws-iam'),
    AccountPrincipal: jest.fn(),
    Role: jest.fn().mockImplementation(() => ({
        addToPolicy: jest.fn(),
        addManagedPolicy: jest.fn()
    })),
    PolicyStatement: jest.fn(),
    ManagedPolicy: {
        fromAwsManagedPolicyName: jest.fn()
    }
}));
jest.mock('@aws-cdk/aws-lambda-event-sources', () => ({
    ...jest.requireActual('@aws-cdk/aws-lambda-event-sources'),
    SnsEventSource: jest.fn()
}));
jest.mock('@aws-cdk/core', () => ({
    ...jest.requireActual('@aws-cdk/core'),
    CfnOutput: jest.fn()
}));
jest.mock('@aws-cdk/aws-lambda', () => ({
    ...jest.requireActual('@aws-cdk/aws-lambda'),
    AssetCode: jest.fn(),
    SingletonFunction: jest.fn().mockImplementation(() => ({
        addEventSource: jest.fn()
    }))
}));
jest.mock('@aws-cdk/aws-sns', () => ({
    ...jest.requireActual('@aws-cdk/aws-sns'),
    Topic: jest.fn().mockImplementation(() => ({
        addToResourcePolicy: jest.fn()
    }))
}));
describe('CertificateManager', () => {
    it('Throw if hostedZoneId is not in domain config', async () => {
        const stack = new core_1.Stack(new core_1.App(), mira_config_1.MiraConfig.getBaseStackName('CertificateManager'), {});
        // TODO Check if DomainConfig is always available
        // Add the validation in the config
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            accounts: []
        });
        mira_config_1.MiraConfig.getEnvironment = () => ({
            name: 'some-name',
            profile: 'some-profile',
            env: { account: '12345', region: 'eu-west-1' }
        });
        expect(() => new _1.CertificateManager(stack)).toThrowError('Cannot find hostedZoneId in config.');
    });
    it('call all functions correctly', async () => {
        const stack = new core_1.Stack(new core_1.App(), mira_config_1.MiraConfig.getBaseStackName('CertificateManager'), {});
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            hostedZoneId: '123123123',
            accounts: []
        });
        mira_config_1.MiraConfig.getEnvironment = () => ({
            name: 'some-name',
            profile: 'some-profile',
            env: {
                account: 'test-account',
                region: 'eu-west-1'
            }
        });
        mira_config_1.MiraConfig.getDomainAllowedPrincipals = () => [
            {
                name: 'some-name',
                profile: 'some-profile',
                env: {
                    account: 'test-account2',
                    region: 'eu-west-1'
                }
            }
        ];
        expect(() => new _1.CertificateManager(stack)).not.toThrowError();
        expect(aws_iam_1.AccountPrincipal).toBeCalledTimes(1);
        expect(aws_lambda_1.AssetCode).toBeCalledTimes(1);
        expect(aws_iam_1.Role).toBeCalledTimes(1);
        expect(aws_iam_1.PolicyStatement).toBeCalledTimes(5);
        expect(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName).toBeCalledTimes(1);
        expect(aws_sns_1.Topic).toBeCalledTimes(1);
        expect(aws_lambda_1.SingletonFunction).toBeCalledTimes(1);
        expect(aws_lambda_event_sources_1.SnsEventSource).toBeCalledTimes(1);
        expect(core_1.CfnOutput).toBeCalledTimes(1);
    });
});
//# sourceMappingURL=certificate-manager.test.js.map