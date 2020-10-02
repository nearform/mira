interface FileData {
    [key: string]: string;
}
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
export default class ChangeDetector {
    /**
     * The root path where the snapshot file can be found or stored.
     */
    rootPath: string;
    /**
     * The default file name for the snapshot file.
     */
    snapshotFile: string;
    /**
     * The full filename path for the snapshot file.
     */
    defaultSnapshotFilePath: string;
    constructor(rootPath: string);
    filesChanged(): Promise<boolean>;
    run(): Promise<boolean>;
    takeSnapshot(outputFile: string): Promise<null>;
    getSnapshot(): Promise<FileData | null>;
    getHash(value: string): string;
}
export {};
