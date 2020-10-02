'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * ## ErrorLogger Class
 * This class is used internally by Mira to log errors to an output file.
 * The log files generated can be used to help debug deployment issues and use
 * the output file name mira-errors-yyyymmddhhss.log.
 * @packageDocumentation
 */
const dateformat_1 = __importDefault(require("dateformat"));
const util_1 = require("util");
/** @ignore - Excluded from documentation generation.  */
const unlink = util_1.promisify(fs_1.default.unlink).bind(fs_1.default);
/** @ignore - Excluded from documentation generation.  */
const readdir = util_1.promisify(fs_1.default.readdir).bind(fs_1.default);
/**
 * A Mira support class for logging errors to an output file for later debugging.
 *
 * @internal
 * @class ErrorLogger
 */
class ErrorLogger {
    constructor() {
        const d = dateformat_1.default(new Date(), 'yyyymmddhhss');
        this.file = path_1.default.join(process.cwd(), `mira-errors-${d}.log`);
    }
    /**
     * Flush messages to the output stream.
     */
    flushMessages(messages) {
        // do not run if in AWS CodeBuild
        if (undefined === process.env.CODEBUILD_BUILD_ID) {
            const ws = fs_1.default.createWriteStream(this.file);
            messages.map((message) => {
                ws.write(message);
            });
            ws.close();
        }
    }
    /**
     * Remove older Mira Error Log files
     */
    async cleanMessages() {
        const files = await readdir(process.cwd());
        const promises = files
            .filter((file) => {
            return file.match(/mira-errors-\d{12}\.log$/);
        })
            .map(async (file) => {
            return unlink(file).catch(() => Promise.resolve(() => {
                // Windows fix, sometimes this will still generate a non-zero exit
                // code but will also delete the file (intended action).  Some
                // Windows users may not have installed MiniGW / WSL and this will
                // also fail.
                try {
                    child_process_1.default.execSync(`rm -f ${file}`);
                }
                catch (e) {
                    // NOOP
                }
            }));
        });
        await Promise.all(promises);
    }
}
exports.default = ErrorLogger;
//# sourceMappingURL=error-logger.js.map