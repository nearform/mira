"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@aws-cdk/assert/jest");
const error_logger_1 = __importDefault(require("./error-logger"));
const fs_1 = __importDefault(require("fs"));
describe('error logger', () => {
    describe('constructor()', () => {
        test('should generate correct output file', () => {
            const logger = new error_logger_1.default();
            expect(logger.file).toMatch(/mira-errors-\d{12}\.log$/);
        });
    });
    describe('flushMessages()', () => {
        beforeEach(() => {
            try {
                // fs.unlinkSync('/tmp/my-file.log')
            }
            catch (err) {
                // do nothing
            }
        });
        test('should not run if in codebuild', () => {
            process.env.CODEBUILD_BUILD_ID = 'a-codebuild-id';
            const logger = new error_logger_1.default();
            logger.flushMessages([
                'message1',
                'message2'
            ]);
            expect(fs_1.default.existsSync(logger.file)).toBeFalsy();
            delete process.env.CODEBUILD_BUILD_ID;
        });
        test('should not run normally', () => {
            const logger = new error_logger_1.default();
            logger.flushMessages([
                'message1',
                'message2'
            ]);
            expect(fs_1.default.existsSync(logger.file)).toBeTruthy();
            fs_1.default.unlinkSync(logger.file);
        });
    });
    describe('cleanMessages()', () => {
        test('it should delete files', async () => {
            // create some files
            const files = [
                'mira-errors-123123123123.log',
                'mira-errors-123123123124.log',
                'mira-errors-123123123125.log'
            ];
            files.map((file) => {
                fs_1.default.writeFileSync(file, 'foobar');
            });
            const logger = new error_logger_1.default();
            await logger.cleanMessages();
            files.map((file) => {
                expect(fs_1.default.existsSync(file)).toBeFalsy();
            });
        });
    });
});
//# sourceMappingURL=error-logger.test.js.map