"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const utils_1 = require("./utils");
exports.handler = async (event, context) => {
    console.log(`SNS event: ${JSON.stringify(event)}`);
    const lambdaEvent = JSON.parse(event.Records[0].Sns.Message);
    const hostedZone = process.env.HOSTED_ZONE || '';
    if (!hostedZone)
        throw new Error('Hosted Zone not set');
    const type = lambdaEvent.RequestType;
    const source = lambdaEvent.ResourceProperties.Source;
    const target = lambdaEvent.ResourceProperties.Target;
    try {
        const responseData = {};
        switch (type) {
            case 'Create': {
                console.log(`Creating CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`);
                await utils_1.Utils.changeResourceRecordSets(utils_1.Route53Action.CREATE, hostedZone, source, target);
                break;
            }
            case 'Update': {
                const oldsource = lambdaEvent.OldResourceProperties.Source;
                const oldtarget = lambdaEvent.OldResourceProperties.Target;
                console.log(`Deleting old CNAME ${oldsource} -> ${oldtarget} in hosted zone: ${hostedZone}`);
                await utils_1.Utils.changeResourceRecordSets(utils_1.Route53Action.DELETE, hostedZone, oldsource, oldtarget);
                console.log(`Creating new CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`);
                await utils_1.Utils.changeResourceRecordSets(utils_1.Route53Action.UPSERT, hostedZone, source, target);
                break;
            }
            case 'Delete': {
                console.log(`Deleting CNAME ${source} -> ${target} in hosted zone: ${hostedZone}`);
                await utils_1.Utils.deleteRecord(source, target, hostedZone);
                break;
            }
            default:
                console.error(`Unexpected Request Type: ${type}`);
                throw new Error('Unexpected Request Type');
        }
        console.log('Route53 successfully updated');
        const responseStatus = 'SUCCESS';
        return utils_1.send(lambdaEvent, context, responseStatus, responseData);
    }
    catch (error) {
        console.error(`Error: ${error}`);
        const responseStatus = 'FAILED';
        const responseData = {};
        return utils_1.send(lambdaEvent, context, responseStatus, responseData);
    }
};
//# sourceMappingURL=route53-manager.js.map