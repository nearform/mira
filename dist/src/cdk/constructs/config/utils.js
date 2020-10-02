"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployProjectRoleName = exports.getBaseStackNameFromParams = exports.getBaseStackName = void 0;
const change_case_1 = require("change-case");
const config_1 = __importDefault(require("config"));
/**
 * @deprecated
 */
function getBaseStackName(suffix) {
    const pieces = [
        config_1.default.get('app.prefix'),
        config_1.default.get('app.name'),
        suffix
    ];
    const output = pieces
        .filter((p) => p)
        .map((p) => change_case_1.pascalCase(p));
    return output.join('-');
}
exports.getBaseStackName = getBaseStackName;
function getBaseStackNameFromParams(prefix, name, suffix) {
    const pieces = [
        prefix,
        name,
        suffix
    ];
    const output = pieces
        .filter((p) => p)
        .map((p) => change_case_1.pascalCase(p));
    return output.join('-');
}
exports.getBaseStackNameFromParams = getBaseStackNameFromParams;
/**
 * @deprecated
 */
function getDeployProjectRoleName(environment) {
    return `${getBaseStackName()}-DeployProjectRole-${environment}`;
}
exports.getDeployProjectRoleName = getDeployProjectRoleName;
//# sourceMappingURL=utils.js.map