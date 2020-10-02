"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
/**
 * The Transpiler class allows Mira to compile recently changed TypeScript files to save time on larger code bases.
 * It respects any existing `tsconfig.json` file within the project.
 * @internal
 */
class Transpiler {
    constructor(filePath) {
        this.filePath = filePath;
    }
    async run() {
        const res = await this.findTSConfigFile(process.cwd());
        if (res) {
            const relativePath = path_1.default.dirname(path_1.default.relative(process.cwd(), res));
            const compiledFile = await this.compile(relativePath);
            return compiledFile;
        }
        else {
            throw new Error('Cannot find tsconfig.json file in project path.');
        }
    }
    async compile(configPath) {
        const command = `npx tsc -p ${configPath}`;
        return new Promise((resolve, reject) => {
            child_process_1.exec(command, {
                cwd: process.cwd()
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                // change file name
                const newFilePath = this.changeExtension('js');
                return resolve(newFilePath);
            });
        });
    }
    changeExtension(newExtension) {
        return this.filePath.substring(0, this.filePath.length - 2) + newExtension;
    }
    async findTSConfigFile(start) {
        return new Promise((resolve, reject) => {
            glob_1.default('**/tsconfig.json', {
                cwd: start,
                ignore: [
                    '/**/node_modules/**',
                    'node_modules/**'
                ]
            }, (err, matches) => {
                if (err) {
                    return reject(err);
                }
                if (matches.length) {
                    return resolve(matches[0]);
                }
                return resolve(null);
            });
        });
    }
}
exports.default = Transpiler;
//# sourceMappingURL=transpiler.js.map