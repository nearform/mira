/**
 * This function programmatically defines the default.json file
 * @internal
 */
export declare function getConfigSchema(): object;
/**
 * Reads the defined file and returns it.
 * @internal
 */
export declare function readJsonFile(filePath: string): string;
/**
 * Uses a programmatically defined schema and validates a data input.
 * @internal
 */
export declare function validateConfig(config: object): boolean;
