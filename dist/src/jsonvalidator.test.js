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
require("@aws-cdk/assert/jest");
const JsonValidation = __importStar(require("./jsonvalidator"));
describe('jsonvalidator', () => {
    test('Json validator: Non existent file load throws an error', () => {
        expect(() => {
            JsonValidation.readJsonFile('bogusfile');
        }).toThrowError();
    });
    test('Json validator: Can load file', () => {
        expect(() => {
            JsonValidation.readJsonFile('/config/__mocks__/default.json');
        }).not.toThrowError();
    });
    test('Json validator: Sample file passes', () => {
        expect(() => {
            JsonValidation.validateConfig({ app: { prefix: 'prefix', name: 'name' }, accounts: {} });
        }).not.toThrowError();
    });
    test('Json validator: Broken sample file throws error', () => {
        expect(() => {
            JsonValidation.validateConfig({ app: { prefix: 'prefix' } });
        }).toThrowError();
    });
});
//# sourceMappingURL=jsonvalidator.test.js.map