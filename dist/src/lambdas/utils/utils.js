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
exports.Utils = exports.Route53Action = void 0;
const aws = __importStar(require("aws-sdk"));
const crypto = __importStar(require("crypto"));
const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
/**
 * The maximum number of attempts made in resolving various resources such as
 * DNS records or Certificates.
 *
 * @ignore - Excluded from documentation generation.
 */
const maxAttempts = 10;
/**
 * An Enum representing Route 53 Actions
 *
 * @ignore - Excluded from documentation generation.
 */
var Route53Action;
(function (Route53Action) {
    Route53Action["UPSERT"] = "UPSERT";
    Route53Action["CREATE"] = "CREATE";
    Route53Action["DELETE"] = "DELETE";
})(Route53Action = exports.Route53Action || (exports.Route53Action = {}));
const domainOnList = (list, domain) => {
    return list.filter((entry) => entry.Name === `${domain}.`).length > 0;
};
class Utils {
    /**
     * implementation based on https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-certificatemanager/lambda-packages/dns_validated_certificate_handler/lib/index.js
     * @param {string} requestId
     * @param {string} domainName
     * @param {string[]} subjectAlternativeNames
     * @param {string} hostedZoneId
     * @param {string} region
     */
    static async requestCertificate(requestId, domainName, subjectAlternativeNames, hostedZoneId, region, route53Role) {
        var _a, _b, _c;
        const acm = new aws.ACM({ region });
        console.log(`Requesting certificate for ${domainName}`);
        console.log('debug message #1');
        const reqCertResponse = await acm.requestCertificate({
            DomainName: domainName,
            SubjectAlternativeNames: subjectAlternativeNames,
            IdempotencyToken: crypto.createHash('sha256').update(requestId).digest('hex').substr(0, 32),
            ValidationMethod: 'DNS'
        }).promise();
        console.log('debug message #2');
        console.log(`Certificate ARN: ${reqCertResponse.CertificateArn}`);
        if (!reqCertResponse.CertificateArn)
            throw new Error('Certificate couldn\'t be created, no CertificateArn available in RequestCertificateResponse.');
        console.log('Waiting for ACM to provide DNS records for validation...');
        let record;
        for (let attempt = 0; attempt < maxAttempts && !record; attempt++) {
            const reqCertDescribeResponse = await acm.describeCertificate({ CertificateArn: reqCertResponse.CertificateArn }).promise();
            const options = (reqCertDescribeResponse && reqCertDescribeResponse.Certificate && reqCertDescribeResponse.Certificate.DomainValidationOptions) || [];
            if (options.length > 0 && options[0].ResourceRecord) {
                record = options[0].ResourceRecord;
            }
            else {
                // Exponential backoff with jitter based on 200ms base
                // component of backoff fixed to ensure minimum total wait time on
                // slow targets.
                const base = Math.pow(2, attempt);
                await sleep(Math.random() * base * 50 + base * 150);
            }
        }
        if (!record) {
            throw new Error(`Response from describeCertificate did not contain DomainValidationOptions after ${maxAttempts} attempts.`);
        }
        console.log(`Assuming role with Route53 permissions: ${route53Role}`);
        const sts = new aws.STS();
        const sessionCredentials = await sts.assumeRole({ RoleArn: route53Role, RoleSessionName: 'CrossAccountRoute53LambdaSession' }).promise();
        aws.config.update({
            accessKeyId: (_a = sessionCredentials === null || sessionCredentials === void 0 ? void 0 : sessionCredentials.Credentials) === null || _a === void 0 ? void 0 : _a.AccessKeyId,
            secretAccessKey: (_b = sessionCredentials === null || sessionCredentials === void 0 ? void 0 : sessionCredentials.Credentials) === null || _b === void 0 ? void 0 : _b.SecretAccessKey,
            sessionToken: (_c = sessionCredentials === null || sessionCredentials === void 0 ? void 0 : sessionCredentials.Credentials) === null || _c === void 0 ? void 0 : _c.SessionToken
        });
        console.log(`Upserting DNS record into zone ${hostedZoneId}: ${record.Name} ${record.Type} ${record.Value}`);
        const route53 = new aws.Route53();
        const changeBatch = await route53.changeResourceRecordSets({
            ChangeBatch: {
                Changes: [{
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: record.Name,
                            Type: record.Type,
                            TTL: 60,
                            ResourceRecords: [{
                                    Value: record.Value
                                }]
                        }
                    }]
            },
            HostedZoneId: hostedZoneId
        }).promise();
        console.log('Waiting for DNS records to commit...');
        await route53.waitFor('resourceRecordSetsChanged', {
            // Wait up to 5 minutes
            $waiter: {
                delay: 30,
                maxAttempts: 10
            },
            Id: changeBatch.ChangeInfo.Id
        }).promise();
        console.log('Waiting for validation...');
        await acm.waitFor('certificateValidated', {
            // Wait up to 9 minutes and 30 seconds
            $waiter: {
                delay: 30,
                maxAttempts: 19
            },
            CertificateArn: reqCertResponse.CertificateArn || ''
        }).promise();
        return reqCertResponse.CertificateArn;
    }
    static async deleteCertificate(identifier, region, route53Role) {
        var _a;
        const acm = new aws.ACM({ region });
        try {
            console.log(`Waiting for certificate ${identifier} to become unused`);
            let arn = identifier;
            if (identifier.startsWith('arn:')) {
                let inUseByResources = [];
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const { Certificate } = await acm.describeCertificate({ CertificateArn: identifier }).promise();
                    inUseByResources = (Certificate === null || Certificate === void 0 ? void 0 : Certificate.InUseBy) || [];
                    if (inUseByResources.length) {
                        // Exponential backoff with jitter based on 200ms base
                        // component of backoff fixed to ensure minimum total wait time on
                        // slow targets.
                        const base = Math.pow(2, attempt);
                        await sleep(Math.random() * base * 50 + base * 150);
                    }
                    else {
                        break;
                    }
                }
                if (inUseByResources.length) {
                    throw new Error(`Response from describeCertificate did not contain an empty InUseBy list after ${maxAttempts} attempts.`);
                }
                console.log(`Deleting certificate ${identifier}`);
            }
            else {
                const availableCertificates = await acm.listCertificates().promise();
                const certificateSummary = (_a = availableCertificates === null || availableCertificates === void 0 ? void 0 : availableCertificates.CertificateSummaryList) === null || _a === void 0 ? void 0 : _a.find((certificateEntry) => {
                    return certificateEntry.DomainName === identifier;
                });
                arn = (certificateSummary === null || certificateSummary === void 0 ? void 0 : certificateSummary.CertificateArn) || '';
            }
            if (!arn) {
                console.warn(`${identifier} not found as a certificate, possible removed manually`);
                return Promise.resolve();
            }
            await acm.deleteCertificate({
                CertificateArn: arn
            }).promise();
            console.log(`In here there should be role assumed: ${route53Role} and confirmation DNS record should be removed`);
        }
        catch (err) {
            if (err.name !== 'ResourceNotFoundException') {
                throw err;
            }
        }
    }
    static async deleteRecord(source, target, hostedZone) {
        const route53 = new aws.Route53();
        const matchingRecords = await route53.listResourceRecordSets({ HostedZoneId: hostedZone }).promise();
        if (!domainOnList(matchingRecords.ResourceRecordSets, source))
            return Promise.resolve('No ResourceRecordSets found');
        console.log('found record set, performing action DELETE');
        return this.changeResourceRecordSets(Route53Action.DELETE, hostedZone, source, target);
    }
    static async changeResourceRecordSets(action, hostedZone, source, target) {
        const route53 = new aws.Route53();
        return route53.changeResourceRecordSets({
            HostedZoneId: hostedZone,
            ChangeBatch: {
                Comment: `CNAME ${source} -> ${target}`,
                Changes: [
                    {
                        Action: action,
                        ResourceRecordSet: {
                            Name: source,
                            Type: 'CNAME',
                            TTL: 300,
                            ResourceRecords: [{ Value: target }]
                        }
                    }
                ]
            }
        }).promise();
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map