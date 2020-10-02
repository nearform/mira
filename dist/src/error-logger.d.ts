/**
 * A Mira support class for logging errors to an output file for later debugging.
 *
 * @internal
 * @class ErrorLogger
 */
export default class ErrorLogger {
    file: string;
    constructor();
    /**
     * Flush messages to the output stream.
     */
    flushMessages(messages: string[]): void;
    /**
     * Remove older Mira Error Log files
     */
    cleanMessages(): Promise<void>;
}
