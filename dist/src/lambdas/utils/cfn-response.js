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
exports.send = void 0;
const https = __importStar(require("https"));
const url = __importStar(require("url"));
exports.SUCCESS = 'SUCCESS';
exports.FAILED = 'FAILED';
async function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
    const responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
        PhysicalResourceId: physicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: noEcho || false,
        Data: responseData
    });
    console.log(responseBody);
    console.log('Response body:\n', responseBody);
    console.log(event.ResponseURL);
    const parsedUrl = new url.URL(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: `${parsedUrl.pathname}?${parsedUrl.searchParams}`,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length
        }
    };
    console.log(options);
    return new Promise((resolve, reject) => {
        const request = https.request(options, function (response) {
            console.log('Status code: ' + response.statusCode);
            console.log('Status message: ' + response.statusMessage);
            resolve();
        });
        request.on('error', function (error) {
            console.log('send(..) failed executing https.request(..): ' + error);
            reject(error);
        });
        request.write(responseBody);
        request.end();
    });
}
exports.send = send;
//# sourceMappingURL=cfn-response.js.map