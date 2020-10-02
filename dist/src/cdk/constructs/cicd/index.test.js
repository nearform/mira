"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("@aws-cdk/assert");
const core_1 = require("@aws-cdk/core");
const _1 = require(".");
jest.mock('config');
describe('CICD', () => {
    it('Creates a CICD stack with role as Caller Identity', async () => {
        const app = new core_1.App();
        const cicd = new _1.Cicd(app, {
            callerIdentityResponse: {
                Arn: 'arn:aws:sts::123456789012:assumed-role/demo/TestAR'
            },
            environmentVariables: []
        });
        assert_1.expect(cicd).to(assert_1.haveResource('AWS::CodeBuild::Project'));
        assert_1.expect(cicd).to(assert_1.haveResource('AWS::CodePipeline::Pipeline'));
    });
    it('Creates a CICD stack with user as Caller Identity', () => {
        const app = new core_1.App();
        const cicd = new _1.Cicd(app, {
            callerIdentityResponse: {
                Arn: 'arn:aws:iam::101259067028:user/demo'
            },
            environmentVariables: []
        });
        assert_1.expect(cicd).to(assert_1.haveResource('AWS::CodeBuild::Project'));
        assert_1.expect(cicd).to(assert_1.haveResource('AWS::CodePipeline::Pipeline'));
    });
});
//# sourceMappingURL=index.test.js.map