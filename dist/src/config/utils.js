"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvironment = exports.loadAWSProfile = exports.getUrl = exports.nameResource = void 0;
const change_case_1 = require("change-case");
const parse_domain_1 = require("parse-domain");
const config_1 = __importDefault(require("config"));
const lodash_1 = __importDefault(require("lodash"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
/**
 * It is important that we disallow undefined here, otherwise resource name collisions may occur
 * @internal
 */
function nameResource(namespace, ...subNames) {
    return [namespace, ...subNames].map(str => change_case_1.pascalCase(str + '')).join('-');
}
exports.nameResource = nameResource;
/**
 * In developer mode build using a sub-domain of the base domain. Otherwise, parse the base domain from the web app URL.
 * @internal
 */
function getUrl(envData, isDeveloperMode, stackName) {
    // If webAppUrl is specified, always prefer the given value.
    if (envData.webAppUrl) {
        if (envData.baseDomain) {
            throw new Error(`Cannot specify baseDomain when already given webAppUrl for ${envData.name}`);
        }
        let baseDomain;
        const parsedDomain = parse_domain_1.parseDomain(parse_domain_1.fromUrl(envData.webAppUrl));
        if (parsedDomain.type === parse_domain_1.ParseResultType.Listed) {
            baseDomain = `${parsedDomain.domain}.${parsedDomain.topLevelDomains.join('.')}`;
        }
        else if (parsedDomain.type === parse_domain_1.ParseResultType.NotListed) {
            console.warn(`The webAppUrl url '${envData.webAppUrl}' domain is not listed.`);
            baseDomain = `${parsedDomain.labels.slice(-2).join('.')}`;
        }
        else {
            throw new Error(`Is not possible to extract baseDomain from the webAppUrl '${envData.webAppUrl}'`);
        }
        return { baseDomain, webAppUrl: envData.webAppUrl };
    }
    // Outside of developer mode, webAppUrl is required.
    if (!isDeveloperMode) {
        throw new Error(`No webAppUrl set for ${envData.name}`);
    }
    // In developer mode, baseDomain is required.
    if (!envData.baseDomain) {
        throw new Error(`No baseDomain set for ${envData.name}`);
    }
    // In developer mode, webAppUrl will be generated unless it is specified in the config.
    const subdomain = stackName.toLowerCase();
    const webAppUrl = `${subdomain}.${envData.baseDomain}`;
    return { baseDomain: envData.baseDomain, webAppUrl };
}
exports.getUrl = getUrl;
/**
 * FIXME: maybe there is a less hacky way to do this?
 * https://stackoverflow.com/questions/44433527/how-to-load-config-from-aws-config
 * @internal
 */
function loadAWSProfile(profile) {
    // temporarily override
    const cleanups = [];
    cleanups.push(overrideEnv('AWS_PROFILE', profile));
    cleanups.push(overrideEnv('AWS_SDK_LOAD_CONFIG', 'true'));
    // load
    const credentials = new aws_sdk_1.default.SharedIniFileCredentials({ profile });
    const awsConfig = new aws_sdk_1.default.Config({ credentials });
    // cleanup
    for (const cleanup of cleanups)
        cleanup();
    // delete require.cache['aws-sdk'] // hopefully this isn't needed
    // format
    const account = (lodash_1.default.get(awsConfig, 'credentials.roleArn', '').match(/:\d{12}:/) || [''])[0].replace(/:/gi, '');
    const region = awsConfig.region;
    if (!account || !region) {
        throw new Error(`AWS profile ${profile} is missing role_arn or region information`);
    }
    return { profile, account, region };
}
exports.loadAWSProfile = loadAWSProfile;
function overrideEnv(key, value) {
    const before = process.env[key];
    process.env[key] = value;
    return () => {
        if (before === 'undefined')
            delete process.env[key];
        else
            process.env[key] = before;
    };
}
function loadEnvironment(name) {
    const environments = config_1.default.get('environments');
    if (!environments)
        throw new Error('Missing config.environments');
    for (const key in environments) {
        const value = environments[key];
        environments[change_case_1.pascalCase(key)] = value;
        if (key !== change_case_1.pascalCase(key)) {
            delete environments[key];
        }
    }
    const envData = environments[change_case_1.pascalCase(name)];
    if (!envData) {
        throw new Error(`Cannot find config for environment ${name || 'undefined'}`);
    }
    return {
        ...envData,
        name
    };
}
exports.loadEnvironment = loadEnvironment;
//# sourceMappingURL=utils.js.map