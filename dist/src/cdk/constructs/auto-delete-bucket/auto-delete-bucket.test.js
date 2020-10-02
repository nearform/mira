"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@aws-cdk/assert/jest");
const core_1 = require("@aws-cdk/core");
const _1 = require(".");
describe('Auto-delete bucket', () => {
    it('throws an error if wrong removalPolicy is passed as a prop', () => {
        const stack = new core_1.Stack();
        expect(() => {
            new _1.AutoDeleteBucket(stack, 'ADB', {
                removalPolicy: core_1.RemovalPolicy.RETAIN
            });
        }).toThrowError('"removalPolicy" must be DESTROY');
    });
    it('creates the bucket and all necesarry resources', () => {
        const stack = new core_1.Stack();
        new _1.AutoDeleteBucket(stack, 'ADB');
        expect(stack).toHaveResource('AWS::S3::Bucket');
        expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
            Handler: 'lambda/index.handler',
            Runtime: 'nodejs10.x',
            Timeout: 900
        });
        // TODO: more fine grained test for policies
        // (needs @aws-cdk/assert support for arrayLike and objectLike)
        expect(stack).toHaveResource('AWS::IAM::Policy');
        //   expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
        //     PolicyDocument: {
        //       Statement: [
        //         {
        //           Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
        //           Effect: 'Allow'
        //         }
        //       ]
        //     }
        //   })
        //   expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
        //     PolicyDocument: {
        //       Statement: [
        //         {
        //           Action: ['s3:DeleteObject'],
        //           Effect: 'Allow'
        //         }
        //       ]
        //     }
        //   })
        // })
        expect(stack).toHaveResourceLike('Custom::MiraAutoDeleteBucket');
    });
});
//# sourceMappingURL=auto-delete-bucket.test.js.map