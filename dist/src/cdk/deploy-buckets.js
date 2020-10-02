"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickDeploy = exports.removeAssetDirectories = exports.getTemplateFiles = exports.getStackName = exports.getSiteBuckets = exports.getS3Buckets = exports.getS3 = exports.getRoleArn = exports.getEnvironment = exports.getBucketResources = exports.getBucketRefs = exports.getBucketObjects = exports.getAssetPrefix = exports.getAssetFiles = void 0;
/**
 * Deploys Custom::CDKBucketDeployment resources without using the CDK
 * toolchain.
 */
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const safe_1 = __importDefault(require("colors/safe"));
const child_process_1 = __importDefault(require("child_process"));
const config_1 = __importDefault(require("config"));
const assume_role_1 = require("../assume-role");
const glob_1 = __importDefault(require("glob"));
const app_1 = require("./app");
const mira_config_1 = require("../config/mira-config");
let cdkFiles = fs_1.default.existsSync('cdk.out') ? fs_1.default.readdirSync('cdk.out') : [];
const { getBaseStackNameFromParams } = app_1.MiraApp;
let miraS3;
/**
 * Gets the files within an asset folder.
 */
exports.getAssetFiles = async (id) => {
    assert_1.default(fs_1.default.existsSync(exports.getAssetPrefix(id)) &&
        fs_1.default.statSync(exports.getAssetPrefix(id)).isDirectory(), 'A provided asset ID' +
        ' either did not exist or was not a directory.  Was this intended?');
    return new Promise((resolve, reject) => {
        glob_1.default(`${exports.getAssetPrefix(id)}/**/*`, (err, matches) => {
            if (err) {
                reject(err);
            }
            resolve(matches.map((match) => match.substr(exports.getAssetPrefix(id).length + 1)));
        });
    });
};
/**
 * Gets the asset prefix given some ID.
 */
exports.getAssetPrefix = (id) => `cdk.out/asset.${id}`;
/**
 * Gets the objects from a bucket.
 */
exports.getBucketObjects = async (Bucket) => {
    const s3 = await exports.getS3();
    return s3.listObjects({ Bucket }).promise();
};
/**
 * Gets references for bucket.
 */
exports.getBucketRefs = async () => {
    const files = exports.getTemplateFiles();
    const bucketsBySite = await exports.getSiteBuckets();
    for (const file in files) {
        const template = files[file];
        if (!template.Resources) {
            continue;
        }
        for (const name in template.Resources) {
            if (!template.Resources[name]) {
                continue;
            }
            const { Type, Properties } = template.Resources[name];
            if (!Type) {
                continue;
            }
            if (Type !== 'Custom::CDKBucketDeployment') {
                continue;
            }
            if (!bucketsBySite[Properties.DestinationBucketName.Ref]) {
                // TODO: Throw an error or provide warning?
                console.warn('Something unexpected happened.  Found a ' +
                    'Custom::CDKBucketDeployment with a DestinationBucketName' +
                    ' that is unknown.', Properties.DestinationBucketName.Ref);
                continue;
            }
            bucketsBySite[Properties.DestinationBucketName.Ref].assets =
                Properties.SourceBucketNames.map(({ Ref }) => {
                    return Ref.split(/AssetParameters/g)[1].split(/S3Bucket/g)[0];
                });
        }
    }
    return bucketsBySite;
};
/**
 * Given some template JSON, grabs all resource objects that are of type
 * AWS::S3::Bucket.
 */
exports.getBucketResources = () => {
    const files = exports.getTemplateFiles();
    const bucketsByFile = {};
    for (const file in files) {
        const template = files[file];
        if (!template.Resources) {
            continue;
        }
        for (const name in template.Resources) {
            const { Type } = template.Resources[name];
            if (!Type) {
                continue;
            }
            if (Type !== 'AWS::S3::Bucket') {
                continue;
            }
            if (!bucketsByFile[file]) {
                bucketsByFile[file] = {};
            }
            bucketsByFile[file][name] = template.Resources[name];
        }
    }
    return bucketsByFile;
};
/**
 * Gets the environment for Mira.
 */
exports.getEnvironment = () => {
    const env = mira_config_1.MiraConfig.getEnvironment();
    return env;
};
/**
 * Given a provided profile, reads the users local ~/.aws/config file and
 * @param {*} profile
 */
exports.getRoleArn = (profile) => {
    const cwd = process.cwd();
    process.chdir(process.env.HOME || '');
    if (!fs_1.default.existsSync('.aws/config')) {
        // TODO: Throw an error?
        process.chdir(cwd);
        throw new Error('Role not found');
    }
    const lines = fs_1.default.readFileSync('.aws/config', 'utf8').split(/\n/g);
    process.chdir(cwd);
    const idx = lines.findIndex((line) => {
        const regexp = new RegExp(`\\[profile ${profile}`);
        return !!regexp.exec(line);
    });
    if (idx === -1) {
        // TODO: Throw an error?
        throw new Error('Role not found');
    }
    const roleLine = lines.slice(idx).find((line) => !!line.match(/^\s*role_arn\s*=/));
    if (!roleLine) {
        // TODO: Throw an error if roleLine is null?
        throw new Error('Role not found');
    }
    return roleLine.split(/=/).slice(1).join('=').trim();
};
/**
 * Gets the S3 object.
 */
exports.getS3 = async () => {
    if (miraS3) {
        return miraS3;
    }
    const role = exports.getRoleArn(config_1.default.get(`accounts.${exports.getEnvironment().name}.profile`));
    const awsConfig = await assume_role_1.assumeRole(role);
    aws_sdk_1.default.config = awsConfig;
    miraS3 = new aws_sdk_1.default.S3({ apiVersion: '2006-03-01' });
    return miraS3;
};
/**
 * Gets S3 buckets beginning with a prefix.
 * @param {String} prefix
 * @param {String} siteName
 */
exports.getS3Buckets = async (prefix, siteName) => {
    const s3 = await exports.getS3();
    const response = await s3.listBuckets().promise();
    if (!response || !response.Buckets) {
        throw new Error('Failed to retrieve buckets.');
    }
    prefix = prefix.toLowerCase().slice(0, 30);
    siteName = siteName.toLowerCase();
    const bucketPrefix = `${prefix}-${siteName}`;
    const targetBuckets = response.Buckets.filter(({ Name }) => {
        return Name.startsWith(bucketPrefix);
    });
    return targetBuckets;
};
/**
 * For a given template file, gets all site buckets.
 */
exports.getSiteBuckets = async () => {
    const files = exports.getTemplateFiles();
    const siteBuckets = {};
    const bucketsByFile = exports.getBucketResources();
    for (const file in files) {
        if (!bucketsByFile[file]) {
            continue;
        }
        for (const name in bucketsByFile[file]) {
            const { Properties } = bucketsByFile[file][name];
            const { Value: stackName } = Properties.Tags.find(({ Key }) => Key === 'StackName');
            const s3Buckets = await exports.getS3Buckets(stackName, name);
            siteBuckets[name] = {
                s3: s3Buckets.map(({ Name }) => Name)
            };
        }
    }
    return siteBuckets;
};
/**
 * Gets the stack name.
 */
exports.getStackName = () => {
    const stackName = getBaseStackNameFromParams(config_1.default.get('app.prefix'), config_1.default.get('app.name'), 'Service');
    return stackName;
};
/**
 * Gets the template files for the given CWD.
 */
exports.getTemplateFiles = () => {
    const templateFiles = {};
    cdkFiles = cdkFiles.filter((file) => file.endsWith('.template.json'));
    for (const file of cdkFiles) {
        templateFiles[file] = JSON.parse(fs_1.default.readFileSync(`cdk.out/${file}`, 'utf8'));
    }
    return templateFiles;
};
/**
 * Removes assets directories.
 */
exports.removeAssetDirectories = () => {
    for (const dir of cdkFiles) {
        if (fs_1.default.statSync(`cdk.out/${dir}`).isDirectory()) {
            child_process_1.default.execSync(`rm -rf ${dir}`, {
                cwd: `${process.cwd()}/cdk.out`
            });
        }
    }
};
/**
 * Quickly deploys an asset bundle generated by CDK to an intended S3 bucket
 * as defined by a CDK generated Cfn template.
 */
exports.quickDeploy = async () => {
    const sites = await exports.getBucketRefs();
    const s3 = await exports.getS3();
    for (const site in sites) {
        const { s3: buckets, assets } = sites[site];
        for (const Bucket of buckets) {
            console.info(safe_1.default.yellow('Updating Bucket'), Bucket);
            for (const id of assets) {
                const files = await exports.getAssetFiles(id);
                for (const file of files) {
                    const obj = {
                        ACL: 'public-read',
                        Body: fs_1.default.readFileSync(`${exports.getAssetPrefix(id)}/${file}`, 'utf8'),
                        Bucket,
                        ContentType: require('mime-types').lookup(file),
                        Key: file
                    };
                    if (app_1.MiraApp.isVerbose()) {
                        console.info(`Putting object: ${JSON.stringify(obj, null, 2)}`);
                    }
                    else {
                        console.info(`\n${safe_1.default.yellow('Putting object:')}\n${file}`);
                    }
                    const result = await s3.putObject(obj).promise();
                    if (app_1.MiraApp.isVerbose()) {
                        console.info(`Put object: ${JSON.stringify(result, null, 2)}`);
                    }
                    console.info(`${safe_1.default.cyan('File Available at')}: https://${Bucket}.s3-${exports.getEnvironment().env.region}.amazonaws.com/${file}`);
                }
                console.info(safe_1.default.green('Done Updating Bucket'));
            }
        }
    }
};
//# sourceMappingURL=deploy-buckets.js.map