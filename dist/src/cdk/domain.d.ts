import { MiraApp } from './app';
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export declare class MiraDomainApp extends MiraApp {
    constructor();
    /**
     * Initializes the app and stack.
     */
    initialize(): Promise<void>;
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp(): void;
}
