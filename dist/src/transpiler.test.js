"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transpiler_1 = __importDefault(require("./transpiler"));
const path_1 = __importDefault(require("path"));
test('should throw if no tsconfig file is found', () => {
    const t = new transpiler_1.default('sampleFile.ts');
    t.findTSConfigFile = jest.fn(async () => { return null; });
    expect(t.run.bind(t)).rejects.toThrow('Cannot find tsconfig.json file in project path.');
    jest.restoreAllMocks();
});
test('should find correct tsconfig.json file', async () => {
    const t = new transpiler_1.default('sampleFile.ts');
    const root = path_1.default.resolve(path_1.default.join(__dirname, '..'));
    const res = await t.findTSConfigFile(root) || '';
    expect(path_1.default.resolve(`${root}/${res}`)).toBe(path_1.default.resolve(`${root}/tsconfig.json`));
});
test('should change extension to file', () => {
    const t = new transpiler_1.default('sampleFile.ts');
    const res = t.changeExtension('foo');
    expect(res).toBe('sampleFile.foo');
});
test('should return null when passing the wrong path', async () => {
    const t = new transpiler_1.default('sampleFile.ts');
    const root = __dirname;
    const res = await t.findTSConfigFile(root);
    expect(res).toBe(null);
});
test('should return null when passing the wrong path', async () => {
    const t = new transpiler_1.default('sampleFile.ts');
    const root = __dirname;
    const res = await t.findTSConfigFile(root);
    expect(res).toBe(null);
});
test('should throw access error when passing empty path', async () => {
    console.error = jest.fn();
    const t = new transpiler_1.default('sampleFile.ts');
    try {
        await t.findTSConfigFile(' ');
    }
    catch (err) {
        expect(err.errno === -13 || err.errno === -1).toBe(true);
        expect(err.code === 'EACCES' || err.code === 'EPERM').toBe(true);
    }
});
//# sourceMappingURL=transpiler.test.js.map