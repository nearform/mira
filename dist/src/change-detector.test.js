"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@aws-cdk/assert/jest");
const path_1 = __importDefault(require("path"));
const change_detector_1 = __importDefault(require("./change-detector"));
const fs_1 = __importDefault(require("fs"));
const fixturesDirectory = path_1.default.join(__dirname, '..', 'test', 'fixtures', 'change-detector');
const snapshotFile = path_1.default.join(fixturesDirectory, '.mira.snapshot');
describe('change detector', () => {
    beforeEach(() => {
        try {
            return fs_1.default.unlinkSync(snapshotFile);
        }
        catch (err) {
            // do nothing
        }
    });
    describe('run()', () => {
        test('should return true if first run', async () => {
            const root = fixturesDirectory;
            const cd = new change_detector_1.default(root);
            const res = await cd.run();
            expect(res).toBeTruthy();
            expect(fs_1.default.existsSync(snapshotFile)).toBeTruthy();
            fs_1.default.unlinkSync(snapshotFile);
        });
        test('should return false on second run', async () => {
            const root = fixturesDirectory;
            const cd = new change_detector_1.default(root);
            await cd.run();
            const res = await cd.run();
            expect(res).toBeFalsy();
            expect(fs_1.default.existsSync(snapshotFile)).toBeTruthy();
            fs_1.default.unlinkSync(snapshotFile);
        });
        test('should return false if a file changes', async () => {
            const root = fixturesDirectory;
            const cd = new change_detector_1.default(root);
            await cd.run();
            // change foo file
            fs_1.default.writeFileSync(path_1.default.join(fixturesDirectory, 'foo.txt'), 'f00');
            const res = await cd.run();
            expect(res).toBeTruthy();
            expect(fs_1.default.existsSync(snapshotFile)).toBeTruthy();
            fs_1.default.unlinkSync(snapshotFile);
            fs_1.default.writeFileSync(path_1.default.join(fixturesDirectory, 'foo.txt'), 'foo');
        });
    });
    describe('getSnapshot()', () => {
        test('should return null if snapshot is not found', async () => {
            const cd = new change_detector_1.default(fixturesDirectory);
            const res = await cd.getSnapshot();
            expect(res).toBe(null);
        });
        test('should return file  content if snapshot is found', async () => {
            const data = [
                'fileA||apoifhaphfaohas',
                'fileB||sdohsodhsodhsd',
                'path/to/fileC||fileCData'
            ];
            fs_1.default.writeFileSync(snapshotFile, data.join('\n'));
            const cd = new change_detector_1.default(fixturesDirectory);
            const res = await cd.getSnapshot();
            fs_1.default.unlinkSync(snapshotFile);
            expect(res).not.toBeNull();
            if (res) {
                expect(Object.keys(res).length).toBe(data.length);
                expect(res.fileA).toBe('apoifhaphfaohas');
                expect(res.fileB).toBe('sdohsodhsodhsd');
                expect(res['path/to/fileC']).toBe('fileCData');
            }
            else {
                throw new Error('Error getting snapshot');
            }
        });
    });
    describe('takeSnapshot()', () => {
        test('should return null after creating snapshot', async () => {
            const cd = new change_detector_1.default(fixturesDirectory);
            const res = await cd.takeSnapshot(snapshotFile);
            expect(res).toBe(null);
            expect(fs_1.default.existsSync(snapshotFile)).toBeTruthy();
            fs_1.default.unlinkSync(snapshotFile);
        });
    });
});
//# sourceMappingURL=change-detector.test.js.map