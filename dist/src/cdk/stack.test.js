"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stack_1 = require("./stack");
const app_1 = require("./app");
const mira_config_1 = require("../config/mira-config");
const core_1 = require("@aws-cdk/core");
jest.mock('config');
const add = jest.fn();
jest.mock('@aws-cdk/core', () => ({
    ...jest.requireActual('@aws-cdk/core'),
    CfnOutput: jest.fn(),
    Tags: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        of: () => ({ add })
    },
    Aspects: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        of: () => ({ add })
    }
}));
const getCallerIdentityFn = jest.fn().mockReturnValue({ UserId: 'USERID:profile' });
const getUserFn = jest.fn();
jest.mock('aws-sdk', () => ({
    ...jest.requireActual('aws-sdk'),
    IAM: jest.fn().mockReturnValue({
        getUser: () => ({
            promise: getUserFn // jest.fn().mockReturnValue({ User: { UserName: 'test-user' } })
        })
    }),
    STS: jest.fn().mockReturnValue({
        getCallerIdentity: () => ({
            promise: getCallerIdentityFn
        })
    })
}));
mira_config_1.MiraConfig.getEnvironment = jest.fn().mockReturnValue({
    env: {
        account: '101259067028',
        region: 'eu-west-1'
    },
    profile: 'mira-dev',
    name: 'default'
});
describe('MiraServiceStack', () => {
    beforeEach(() => {
        getUserFn.mockReset();
        getUserFn.mockImplementation(() => {
            return { User: { UserName: 'test-user' } };
        });
    });
    const app = new app_1.MiraApp();
    it('applyPolicies calls applyAspect', () => {
        const miraServiceStackInstance = new stack_1.MiraServiceStack(app, 'env');
        expect(miraServiceStackInstance.applyPolicies([])).toEqual(undefined);
        expect(add).toBeCalledTimes(1);
    });
    it('has app initialized', async () => {
        const miraServiceStackInstance = new stack_1.MiraServiceStack(app, 'env', 'sufix');
        // Because the resolved promise doesn't return anything
        // this "undefined" test is actually testing if there was no errors
        expect(await miraServiceStackInstance.initialize()).toEqual(undefined);
        expect(await miraServiceStackInstance.initialized).toBe(undefined);
    });
    it('falls back to STS when IAM getUser call fails', async () => {
        getUserFn.mockReset();
        getUserFn.mockImplementation(() => {
            throw new Error('err');
        });
        const miraServiceStackInstance = new stack_1.MiraServiceStack(app, 'env', 'sufix');
        // Because the resolved promise doesn't return anything
        // this "undefined" test is actually testing if there was no errors
        expect(await miraServiceStackInstance.initialize()).toEqual(undefined);
        expect(await miraServiceStackInstance.initialized).toBe(undefined);
        expect(getCallerIdentityFn).toHaveBeenCalled();
    });
});
describe('MiraStack', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    const stack = new core_1.Stack();
    it('has app initialized', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack, 'Default', {});
        expect(await miraStackInstance.initialize()).toEqual(undefined);
        expect(await miraStackInstance.initialized).toBe(undefined);
        expect(miraStackInstance.parent).toBe(stack);
        expect(miraStackInstance.name).toBe('Default');
    });
    it('addOutput without shouldExport calls CfnOutput one time', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack);
        expect(await miraStackInstance.addOutput('DefaultStack', 'value', false)).toEqual(undefined);
        expect(miraStackInstance.parent).toBe(stack);
        expect(miraStackInstance.name).toBe('DefaultStack');
        expect(core_1.CfnOutput).toBeCalledTimes(1);
    });
    it('addOutput with shouldExport calls CfnOutput two times', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack);
        expect(await miraStackInstance.addOutput('DefaultStack', 'value')).toEqual(undefined);
        expect(core_1.CfnOutput).toBeCalledTimes(2);
    });
    it('creates StringParameter correctly', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack);
        const res = await miraStackInstance.createParameter('Fullname', 'description', 'value');
        expect(res.toString().split('/')[2]).toBe('DefaultStackFullnameParameter');
    });
    it('loadParameter with fullName divided by / correctly', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack);
        const res = await miraStackInstance.loadParameter('Full/Name');
        expect(res.parameterName).toBe('/default/Full/Name');
        expect(res.toString().split('/')[2]).toBe('FullNameParameter');
    });
    it('loadParameter with environment and fullName', async () => {
        const miraStackInstance = new stack_1.MiraStack(stack, 'Default');
        const res = await miraStackInstance.loadParameter('Fullname');
        expect(res.parameterName).toBe('/default/Default/Fullname');
        expect(res.toString().split('/')[2]).toBe('DefaultFullnameParameter');
    });
});
describe('MiraStack Tags', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('Adds default tags', async () => {
        const app = new app_1.MiraApp();
        const miraStackInstance = new stack_1.MiraServiceStack(app, 'env');
        await miraStackInstance.initialized;
        expect(add).toHaveBeenCalledTimes(2);
    });
    it('Adds default tags and cost center', async () => {
        mira_config_1.MiraConfig.getCostCenter = jest.fn().mockReturnValue('123');
        const app = new app_1.MiraApp();
        const miraStackInstance = new stack_1.MiraServiceStack(app, 'env');
        await miraStackInstance.initialized;
        expect(add).toHaveBeenCalledTimes(3);
    });
});
//# sourceMappingURL=stack.test.js.map