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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const inquirer = __importStar(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autocomplete_1 = require("./autocomplete");
const validators = __importStar(require("./validators"));
/**
 * The default directory where Mira expects configuration files.
 * Note: The path is relative to the root directory so ROOTDIR/config.
 *
 * @ignore - Excluded from documentation generation.
 */
const configDirPath = 'config';
function createDefaultJSON(config) {
    try {
        if (!fs_1.default.existsSync(configDirPath)) {
            fs_1.default.mkdirSync(configDirPath);
        }
        const json = JSON.stringify(config, null, 2);
        const defaultFilePath = `${configDirPath}${path_1.default.sep}default.json`;
        fs_1.default.writeFileSync(`${configDirPath}${path_1.default.sep}default.json`, json);
        console.log(chalk_1.default.whiteBright(`Successfully created ${defaultFilePath}`));
    }
    catch (error) {
        console.log(chalk_1.default.red('Could not create configuration directory.'));
        process.exit(-1);
    }
}
async function configWizard() {
    console.log();
    console.log(chalk_1.default.white('This utility will walk you through creating a default.json file.'));
    console.log();
    console.log(chalk_1.default.white('Please consult the Mira documentation for definitive documentation'));
    console.log(chalk_1.default.white('on these fields and exactly what they do.\n'));
    console.log(chalk_1.default.white('Press ^C at any time to quit.\n'));
    const answers = await inquirer
        .prompt([
        {
            name: 'name',
            message: 'Application Name?',
            validate: (name) => name.length > 0
        },
        {
            name: 'prefix',
            message: 'Application Prefix?',
            validate: (prefix) => prefix.length > 0
        },
        {
            name: 'account',
            message: 'CI/CD Environment AWS Account ID?',
            validate: validators.isValidAwsAccountId
        },
        {
            type: 'autocomplete',
            name: 'region',
            source: autocomplete_1.buildSearchRegions(),
            message: 'CI/CD Environment AWS Account Region?'
        },
        {
            name: 'profile',
            message: 'CI/CD Environment local AWS CLI configuration profile name?',
            validate: validators.isValidAwsCliProfile
        }
    ]);
    const { account, region, name, prefix, profile } = answers;
    const config = {
        app: {
            prefix,
            name
        },
        dev: {
            target: 'default'
        },
        accounts: {
            default: {
                env: {
                    account,
                    region
                },
                profile
            }
        }
    };
    createDefaultJSON(config);
}
exports.default = configWizard;
//# sourceMappingURL=make-default-config.js.map