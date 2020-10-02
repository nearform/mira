'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assumeRole = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const child_process_1 = require("child_process");
/**
 * Allow Mira to assume a role based on a given arn. This is used for deployment
 * and allows Mira to use the account specified in the configuration file.
 *
 * @internal
 * @throws Cannot assume role ${roleArn}: Invalid Role
 * @throws Cannot assume role ${roleArn}: &lt;other reason&gt;
 */
async function assumeRole(roleArn) {
    console.log(`Assuming role ${roleArn}`);
    const sts = new aws_sdk_1.default.STS();
    try {
        const roleData = await sts.assumeRole({
            RoleArn: `${roleArn}`,
            RoleSessionName: 'mira-assumed-role'
        }).promise();
        if (roleData.Credentials) {
            aws_sdk_1.default.config = new aws_sdk_1.default.Config({
                accessKeyId: roleData.Credentials.AccessKeyId,
                secretAccessKey: roleData.Credentials.SecretAccessKey,
                sessionToken: roleData.Credentials.SessionToken
            });
            // update environment
            const authData = [
                { name: 'aws_access_key_id', value: roleData.Credentials.AccessKeyId },
                { name: 'aws_secret_access_key', value: roleData.Credentials.SecretAccessKey },
                { name: 'aws_session_token', value: roleData.Credentials.SessionToken }
            ];
            authData.forEach((token) => {
                const commandOptions = [
                    'configure',
                    'set',
                    token.name,
                    token.value,
                    '--profile=client'
                ];
                child_process_1.execFileSync('aws', commandOptions, {
                    stdio: 'inherit',
                    env: {
                        ...process.env
                    }
                });
            });
            return aws_sdk_1.default.config;
        }
        else {
            throw new Error(`Cannot assume role ${roleArn}: Invalid Role`);
        }
    }
    catch (error) {
        throw new Error(`Cannot assume role ${roleArn}: ${error.message}`);
    }
}
exports.assumeRole = assumeRole;
//# sourceMappingURL=assume-role.js.map