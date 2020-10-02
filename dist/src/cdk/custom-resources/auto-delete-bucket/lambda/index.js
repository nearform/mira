"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const delete_bucket_1 = require("../utils/delete-bucket");
const send_response_1 = require("../utils/send-response");
exports.handler = async (event) => {
    const { RequestType, ResourceProperties: { BucketName } = { BucketName: null } } = event;
    let status = 'SUCCESS';
    let reason = '';
    if (!BucketName) {
        status = 'FAILED';
        reason = 'BucketName is required';
    }
    if (BucketName && RequestType === 'Delete') {
        try {
            await delete_bucket_1.deleteBucket(BucketName);
        }
        catch (err) {
            status = 'FAILED';
            reason = `Faild to empty bucket. ${err}`;
        }
    }
    await send_response_1.sendResponse(event.ResponseURL, {
        status,
        reason,
        physicalResourceId: event.LogicalResourceId,
        stackId: event.StackId,
        requestId: event.RequestId,
        logicalResourceId: event.LogicalResourceId,
        data: event.ResourceProperties
    });
};
//# sourceMappingURL=index.js.map