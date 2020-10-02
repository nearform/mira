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
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("@aws-cdk/core"));
const aws_iam_1 = require("@aws-cdk/aws-iam");
const mira_config_1 = require("../../../../config/mira-config");
const _1 = require(".");
describe('Route53ManagerAccessRoleStack', () => {
    it('Throw if hostedZoneId is not in domain config', async () => {
        const stack = new cdk.Stack(new cdk.App(), mira_config_1.MiraConfig.getBaseStackName('DomainManager'), {});
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            accounts: []
        });
        expect(() => new _1.Route53ManagerAccessRoleStack(stack)).toThrowError('Cannot find hostedZoneId in config.');
    });
    it('Can create a ManagedPolicy with id permissionBoundaryPolicy', async () => {
        const stack = new cdk.Stack(new cdk.App(), mira_config_1.MiraConfig.getBaseStackName('DomainManager'), {});
        mira_config_1.MiraConfig.getDomainConfig = () => ({
            hostedZoneId: '123456',
            accounts: []
        });
        mira_config_1.MiraConfig.calculateSharedResourceName = () => 'value';
        const res = await new _1.Route53ManagerAccessRoleStack(stack);
        try {
            new aws_iam_1.ManagedPolicy(res, 'permissionBoundaryPolicy');
        }
        catch (err) {
            expect(err.message).toBe("There is already a Construct with name 'permissionBoundaryPolicy' in Route53ManagerAccessRoleStack [Route53ManagerAccessRoleStack-1]");
        }
    });
});
//# sourceMappingURL=route53-manager-access-role.test.js.map