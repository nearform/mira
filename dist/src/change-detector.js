"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const tmp_1 = __importDefault(require("tmp"));
/** @ignore - Excluded from documentation generation.  */
const read = util_1.promisify(fs_1.default.readFile).bind(fs_1.default);
/** @ignore - Excluded from documentation generation.  */
const stat = util_1.promisify(fs_1.default.stat).bind(fs_1.default);
/** @ignore - Excluded from documentation generation.  */
const write = util_1.promisify(fs_1.default.writeFile).bind(fs_1.default);
/**
 * The Change Detector Class is used to build and maintain a snapshot of code changes
 * between deployments. If there are no changes, Mira will not perform a deployment.
 *
 * Mira uses the `.mira.snapshot` file in the root of the application folder to track
 * changes. A file is considered changed if its time stamp is different to the one listed
 * in the snapshot file.
 *
 * @internal
 */
class ChangeDetector {
    constructor(rootPath) {
        /**
         * The default file name for the snapshot file.
         */
        this.snapshotFile = '.mira.snapshot';
        this.rootPath = rootPath;
        this.defaultSnapshotFilePath = path_1.default.join(this.rootPath, this.snapshotFile);
    }
    async filesChanged() {
        return this.run();
    }
    async run() {
        const snapshot = await this.getSnapshot();
        if (!snapshot) {
            await this.takeSnapshot(this.defaultSnapshotFilePath);
            return true;
        }
        // check against snapshot
        const tempSnapshotFile = tmp_1.default.fileSync();
        await this.takeSnapshot(tempSnapshotFile.name);
        const buf = await read(this.defaultSnapshotFilePath);
        const tmpBuf = await read(tempSnapshotFile.name);
        if (buf.equals(tmpBuf)) {
            // no changes
            return false;
        }
        return true;
    }
    async takeSnapshot(outputFile) {
        return new Promise((resolve, reject) => {
            glob_1.default(`${this.rootPath}/**`, {
                ignore: ['**/node_modules/**', '**/cdk.out/**', '**/mira-err**']
            }, async (err, res) => {
                if (err) {
                    return reject(err);
                }
                const output = [];
                const promises = res.map(async (file) => {
                    const relative = path_1.default.relative(this.rootPath, file);
                    if (relative) { // skip empty files
                        const fileData = await stat(file);
                        const hash = this.getHash(`${fileData.size}${fileData.mtime}`);
                        output.push(`${relative}||${hash}`);
                    }
                });
                await Promise.all(promises);
                await write(outputFile, output.sort().join('\n'));
                return resolve(null);
            });
        });
    }
    async getSnapshot() {
        try {
            const res = await read(path_1.default.join(this.rootPath, this.snapshotFile));
            const output = {};
            res
                .toString()
                .split('\n')
                .forEach((line) => {
                const [file, data] = line.split('||');
                output[file] = data;
            });
            return output;
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
    }
    getHash(value) {
        return crypto_1.default.createHash('md5').update(value).digest('hex');
    }
}
exports.default = ChangeDetector;
//# sourceMappingURL=change-detector.js.map