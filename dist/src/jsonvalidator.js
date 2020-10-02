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
exports.validateConfig = exports.readJsonFile = exports.getConfigSchema = void 0;
/**
 * ## Configuration File Validation
 * The JSON Validator module provides a collection of internal functions used to verify and
 * validate Mira configuration files. Fluent Schema is used to describe the schema itself and
 * Ajv provides validation.
 *
 * @packageDocumentation
 */
const fluent_schema_1 = __importDefault(require("fluent-schema"));
const ajv_1 = __importDefault(require("ajv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * This function programmatically defines the default.json file
 * @internal
 */
function getConfigSchema() {
    return fluent_schema_1.default.object()
        .id('default-config')
        .title('Default Config File Schema')
        .description('Default Config File Schema')
        .prop('app', fluent_schema_1.default.object()
        .prop('prefix', fluent_schema_1.default.string().required())
        .prop('name', fluent_schema_1.default.string().required()))
        .required()
        .prop('accounts', fluent_schema_1.default.object())
        .prop('costCenter', fluent_schema_1.default.string())
        .prop('cicd', fluent_schema_1.default.object()
        .prop('target', fluent_schema_1.default.string())
        .prop('buildspecFile', fluent_schema_1.default.string())
        .prop('permissionsFile', fluent_schema_1.default.string())
        .prop('provider', fluent_schema_1.default.string())
        .prop('profile', fluent_schema_1.default.string())
        .prop('repositoryUrl', fluent_schema_1.default.string())
        .prop('branchName', fluent_schema_1.default.string())
        .prop('codeCommitUserPublicKey', fluent_schema_1.default.string())
        .prop('environmentVariables', fluent_schema_1.default.array())
        .prop('stages', fluent_schema_1.default.array().items(fluent_schema_1.default.object()
        .prop('target', fluent_schema_1.default.string())
        .prop('withDomain', fluent_schema_1.default.boolean())
        .prop('requireManualApproval', fluent_schema_1.default.boolean()))))
        .allOf([
        fluent_schema_1.default.ifThen(fluent_schema_1.default.object().prop('cicd', fluent_schema_1.default.object().prop('target', fluent_schema_1.default.string().required())), fluent_schema_1.default.required(['accounts'])),
        fluent_schema_1.default.ifThen(fluent_schema_1.default.object().prop('cicd', fluent_schema_1.default.object().prop('stages', fluent_schema_1.default.array().items(fluent_schema_1.default.object()
            .prop('target', fluent_schema_1.default.string()).required()))), fluent_schema_1.default.required(['accounts']))
    ])
        .prop('dev', fluent_schema_1.default.object().prop('target', fluent_schema_1.default.string()))
        .ifThen(fluent_schema_1.default.object().prop('dev', fluent_schema_1.default.object().prop('target', fluent_schema_1.default.string().required())), fluent_schema_1.default.required(['accounts']))
        .valueOf();
}
exports.getConfigSchema = getConfigSchema;
/**
 * Reads the defined file and returns it.
 * @internal
 */
function readJsonFile(filePath) {
    const file = path.join(__dirname, filePath);
    if (!fs.existsSync(file)) {
        throw Error('Could not read file: ' + filePath);
    }
    const configRaw = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return configRaw;
}
exports.readJsonFile = readJsonFile;
/**
 * Uses a programmatically defined schema and validates a data input.
 * @internal
 */
function validateConfig(config) {
    const ajv = new ajv_1.default({ allErrors: true, coerceTypes: true });
    const valid = ajv.validate(getConfigSchema(), config);
    if (!valid) {
        throw Error('Validation failed: ' + JSON.stringify(ajv.errors));
    }
    else {
        return true;
    }
}
exports.validateConfig = validateConfig;
//# sourceMappingURL=jsonvalidator.js.map