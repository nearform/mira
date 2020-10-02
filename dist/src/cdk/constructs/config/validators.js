"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidAwsSecretsManagerArn = exports.isValidSshRsaPublicKey = exports.isValidEnvironmentNameList = exports.isValidGitBranchName = exports.isValidDomain = exports.isValidBaseDomain = exports.isValidAwsHostedZoneId = exports.isValidAwsCliProfile = exports.isValidAwsAccountIdList = exports.isValidAwsAccountId = void 0;
const child_process_1 = require("child_process");
function isValidAwsAccountId(input) {
    if (!input)
        return false;
    return /^\d{12}$/.test(input);
}
exports.isValidAwsAccountId = isValidAwsAccountId;
function isValidAwsAccountIdList(input) {
    if (!input)
        return false;
    for (const id of input.split(',')) {
        if (!isValidAwsAccountId(id))
            return false;
    }
    return true;
}
exports.isValidAwsAccountIdList = isValidAwsAccountIdList;
async function isValidAwsCliProfile(input) {
    return new Promise((resolve) => {
        if (!input)
            return resolve(false);
        child_process_1.execFile('aws', ['configure', 'list', '--profile', input], (error) => {
            if (error === null || error === void 0 ? void 0 : error.code) {
                console.log(`\nProfile "${input}" not found.`);
                return resolve(false);
            }
            resolve(true);
        });
    });
}
exports.isValidAwsCliProfile = isValidAwsCliProfile;
function isValidAwsHostedZoneId(input) {
    if (!input)
        return false;
    return /^Z[A-Z0-9]{1,32}$/.test(input);
}
exports.isValidAwsHostedZoneId = isValidAwsHostedZoneId;
function isValidBaseDomain(input) {
    if (!input)
        return false;
    return /^[a-zA-Z0-9-]{1,61}\.[a-zA-Z]{2,}$/.test(input);
}
exports.isValidBaseDomain = isValidBaseDomain;
function isValidDomain(input) {
    if (!input)
        return false;
    return /^(?:[a-zA-Z0-9-]{1,61}\.)+[a-zA-Z]{2,}$/.test(input);
}
exports.isValidDomain = isValidDomain;
async function isValidGitBranchName(input) {
    return new Promise((resolve) => {
        if (!input)
            return resolve(false);
        child_process_1.execFile('git', ['check-ref-format', '--branch', input], (error) => {
            if (error === null || error === void 0 ? void 0 : error.code) {
                return resolve(false);
            }
            resolve(true);
        });
    });
}
exports.isValidGitBranchName = isValidGitBranchName;
function isValidEnvironmentNameList(input) {
    const envNameRegex = /^[a-zA-Z][a-zA-Z0-9]+$/;
    return input.split(',').every(env => envNameRegex.test(env));
}
exports.isValidEnvironmentNameList = isValidEnvironmentNameList;
function isValidSshRsaPublicKey(input) {
    if (!input)
        return false;
    return /^ssh-rsa AAAA[0-9a-z+/]+[=]{0,3}/i.test(input);
}
exports.isValidSshRsaPublicKey = isValidSshRsaPublicKey;
function isValidAwsSecretsManagerArn(input) {
    if (!input)
        return false;
    return /^arn:aws:secretsmanager:[a-z]{2}((-gov)|(-iso(b?)))?-[a-z]+-\d{1}:\d{12}:secret:[a-zA-Z0-9-_]+$/.test(input);
}
exports.isValidAwsSecretsManagerArn = isValidAwsSecretsManagerArn;
//# sourceMappingURL=validators.js.map