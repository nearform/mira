/**
 * The Transpiler class allows Mira to compile recently changed TypeScript files to save time on larger code bases.
 * It respects any existing `tsconfig.json` file within the project.
 * @internal
 */
declare class Transpiler {
    filePath: string;
    constructor(filePath: string);
    run(): Promise<string>;
    private compile;
    changeExtension(newExtension: string): string;
    findTSConfigFile(start: string): Promise<string | null>;
}
export default Transpiler;
