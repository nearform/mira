"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_sns_1 = require("@aws-cdk/aws-sns");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_lambda_event_sources_1 = require("@aws-cdk/aws-lambda-event-sources");
const mira_config_1 = require("../../../../config/mira-config");
const _1 = require(".");
jest.mock('@aws-cdk/core', () => ({
    ...jest.requireActual('@aws-cdk/core'),
    CfnOutput: jest.fn()
}));
jest.mock('@aws-cdk/aws-iam', () => ({
    ...jest.requireActual('@aws-cdk/aws-iam'),
    AccountPrincipal: jest.fn(),
    Role: jest.fn().mockImplementation(() => ({
        addToPolicy: jest.fn(),
        addManagedPolicy: jest.fn()
    })),
    PolicyStatement: jest.fn(),
    ManagedPolicy: {
        fromManagedPolicyName: jest.fn(),
        fromAwsManagedPolicyName: jest.fn()
    },
    ServicePrincipal: jest.fn(),
    CompositePrincipal: jest.fn()
}));
jest.mock('@aws-cdk/aws-sns', () => ({
    ...jest.requireActual('@aws-cdk/aws-sns'),
    Topic: jest.fn().mockImplementation(() => ({
        addToResourcePolicy: jest.fn()
    }))
}));
jest.mock('@aws-cdk/aws-lambda-event-sources', () => ({
    ...jest.requireActual('@aws-cdk/aws-lambda-event-sources'),
    SnsEventSource: jest.fn()
}));
jest.mock('@aws-cdk/aws-lambda', () => ({
    ...jest.requireActual('@aws-cdk/aws-lambda'),
    AssetCode: jest.fn(),
    SingletonFunction: jest.fn().mockImplementation(() => ({
        addEventSource: jest.fn()
    }))
}));
describe('Route53Manager', () => {
    it('Throw if hostedZoneId is not in domain config', async () => {
        const stack = new core_1.Stack(new core_1.App(), mira_config_1.MiraConfig.getBaseStackName('CertificateManager'), {});
        mira_config_1.MiraConfig.getEnvironment = () => ({
            name: 'some-name',
            profile: 'some-profile',
            env: { account: '12345', region: 'eu-west-1' }
        });
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            accounts: []
        });
        expect(() => new _1.Route53Manager(stack)).toThrowError('Cannot find hostedZoneId in config.');
    });
    it('call all functions correctly', async () => {
        const stack = new core_1.Stack(new core_1.App(), mira_config_1.MiraConfig.getBaseStackName('CertificateManager'), {});
        mira_config_1.MiraConfig.getEnvironment = () => ({
            name: 'some-name',
            profile: 'some-profile',
            env: { account: '12345', region: 'eu-west-1' }
        });
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            hostedZoneId: '123456',
            accounts: []
        });
        mira_config_1.MiraConfig.getDomainAllowedPrincipals = () => ([{
                name: 'some-name',
                profile: 'some-profile',
                env: { account: '12345', region: 'eu-west-1' }
            }]);
        mira_config_1.MiraConfig.calculateSharedResourceName = (resource) => `prefix-${resource}`;
        expect(() => new _1.Route53Manager(stack)).not.toThrowError();
        expect(aws_iam_1.AccountPrincipal).toBeCalledTimes(2);
        expect(aws_sns_1.Topic).toBeCalledTimes(1);
        expect(aws_iam_1.PolicyStatement).toBeCalledTimes(6);
        expect(aws_lambda_1.AssetCode).toBeCalledTimes(1);
        expect(aws_iam_1.ManagedPolicy.fromManagedPolicyName).toBeCalledTimes(1);
        expect(aws_iam_1.Role).toBeCalledTimes(2);
        expect(aws_iam_1.ServicePrincipal).toBeCalledTimes(1);
        expect(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName).toBeCalledTimes(1);
        expect(aws_lambda_1.SingletonFunction).toBeCalledTimes(1);
        expect(aws_lambda_event_sources_1.SnsEventSource).toBeCalledTimes(1);
        expect(core_1.CfnOutput).toBeCalledTimes(2);
        expect(aws_iam_1.CompositePrincipal).toBeCalledTimes(1);
    });
});
//# sourceMappingURL=route53-manager.test.js.map