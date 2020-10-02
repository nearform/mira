"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hashed_code_1 = require("./hashed-code");
const core_1 = require("@aws-cdk/core");
jest.mock('@aws-cdk/aws-s3-assets', () => ({
    ...jest.requireActual('@aws-cdk/aws-s3-assets'),
    Asset: jest.fn().mockImplementationOnce(() => ({})).mockImplementation(() => ({
        isZipArchive: true,
        s3BucketName: 'test-bucket',
        s3ObjectKey: 'test-key',
        addResourceMetadata: jest.fn()
    }))
}));
describe('HashedCode', () => {
    test('calling bindToResource before bind throws error', () => {
        const stack = new core_1.Stack();
        const cfn = { type: 'type' };
        const resource = new core_1.CfnResource(stack, 'id', cfn);
        expect(() => {
            new hashed_code_1.HashedCode('path').bindToResource(resource, {});
        }).toThrowError('bindToResource() must be called after bind()');
    });
    test('calling bind and asset with no isZipArchive throws error', () => {
        const stack = new core_1.Stack();
        expect(() => {
            new hashed_code_1.HashedCode('path').bind(stack);
        }).toThrowError('Asset must be a .zip file or a directory (path)');
    });
    test('calling bind returns correct Asset props', () => {
        var _a, _b;
        const stack = new core_1.Stack();
        const hashedCodeInstance = new hashed_code_1.HashedCode('path');
        expect(() => {
            hashedCodeInstance.bind(stack);
        }).not.toThrowError();
        expect((_a = hashedCodeInstance.bind(stack).s3Location) === null || _a === void 0 ? void 0 : _a.bucketName).toBe('test-bucket');
        expect((_b = hashedCodeInstance.bind(stack).s3Location) === null || _b === void 0 ? void 0 : _b.objectKey).toBe('test-key');
    });
    test('calling bind and than bindToResource', () => {
        const stack = new core_1.Stack();
        const cfn = { type: 'type' };
        const resource = new core_1.CfnResource(stack, 'id', cfn);
        const hashedCodeInstance = new hashed_code_1.HashedCode('path');
        hashedCodeInstance.bind(stack);
        hashedCodeInstance.bindToResource(resource);
        hashedCodeInstance.bindToResource(resource, { resourceProperty: 'Test' });
    });
});
//# sourceMappingURL=hashed-code.test.js.map