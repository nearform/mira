"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const send_response_1 = require("../../utils/send-response");
const aws_sdk_1 = require("aws-sdk");
/**
 * IAM class
 * @ignore - Excluded from documentation generation.
 */
const iam = new aws_sdk_1.IAM();
exports.handler = async (event) => {
    var _a;
    /**
     * See the AWS documentation for more information passed in the request for a custom resource.
     *
     * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
     */
    const UserName = event.ResourceProperties.UserName;
    const SSHPublicKeyBody = event.ResourceProperties.SSHPublicKeyBody;
    let status = 'SUCCESS';
    let reason = '';
    let SSHPublicKeyId = '';
    if (!UserName || !SSHPublicKeyBody) {
        status = 'FAILED';
        reason = 'UserName and SSHPublicKeyBody required';
    }
    if (event.RequestType === 'Create') {
        try {
            const rsp = await iam.uploadSSHPublicKey({
                UserName,
                SSHPublicKeyBody
            }).promise();
            SSHPublicKeyId = ((_a = rsp.SSHPublicKey) === null || _a === void 0 ? void 0 : _a.SSHPublicKeyId) || '';
            console.log(`uploaded key: ${SSHPublicKeyId}`);
        }
        catch (err) {
            console.log(err);
            reason = `Unable to add ssh key for user ${UserName}`;
            status = 'FAILED';
        }
    }
    else if (event.RequestType === 'Update') {
        try {
            const keys = await iam.listSSHPublicKeys({
                UserName
            }).promise();
            SSHPublicKeyId = (keys.SSHPublicKeys && keys.SSHPublicKeys[0].SSHPublicKeyId) || '';
            console.log('keys listed');
            if (SSHPublicKeyId) {
                await iam.updateSSHPublicKey({
                    UserName,
                    Status: 'Inactive',
                    SSHPublicKeyId
                }).promise();
                console.log('deactivated key');
                await iam.deleteSSHPublicKey({
                    UserName,
                    SSHPublicKeyId
                }).promise();
                console.log('deleted key');
                await iam.uploadSSHPublicKey({
                    UserName,
                    SSHPublicKeyBody
                }).promise();
                console.log('uploaded the new key');
            }
            else {
                console.log('no keys found to update');
            }
        }
        catch (err) {
            console.log(err);
            reason = `Unable to update ssh key for user ${UserName}`;
            status = 'FAILED';
        }
    }
    else {
        try {
            const keys = await iam.listSSHPublicKeys({
                UserName
            }).promise();
            SSHPublicKeyId = (keys.SSHPublicKeys && keys.SSHPublicKeys[0].SSHPublicKeyId) || '';
            if (SSHPublicKeyId) {
                await iam.updateSSHPublicKey({
                    UserName,
                    Status: 'Inactive',
                    SSHPublicKeyId
                }).promise();
                await iam.deleteSSHPublicKey({
                    UserName,
                    SSHPublicKeyId
                }).promise();
            }
            else {
                console.log('no keys found to update');
            }
        }
        catch (err) {
            console.log(err);
            reason = `Unable to delete ssh key for user ${UserName}`;
            status = 'FAILED';
        }
    }
    await send_response_1.sendResponse(event.ResponseURL, {
        status: status,
        requestId: event.RequestId,
        stackId: event.StackId,
        reason: reason,
        logicalResourceId: event.LogicalResourceId,
        physicalResourceId: `${UserName}-${event.LogicalResourceId}`,
        data: { SSHPublicKeyId }
    });
};
//# sourceMappingURL=index.js.map