import * as cdk from '@aws-cdk/core';
import { MiraServiceStack, MiraStack } from './stack';
import { Stack } from '@aws-cdk/core';
interface Prototypable {
    prototype: Stack;
}
interface StackConstructable {
    new (app: cdk.App, props: {
        env: string;
    }): Stack;
}
interface MiraStackConstructable {
    new (service: MiraServiceStack): MiraStack;
}
interface MiraServiceStackConstructable {
    new (app: MiraApp): MiraServiceStack;
}
export declare type MiraValidStack = Stack & Prototypable & MiraStackConstructable & MiraServiceStackConstructable & StackConstructable;
declare type MiraStackList = Array<MiraValidStack>;
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export declare class MiraApp {
    cdkApp: cdk.App;
    instance: MiraApp;
    mainStack: MiraStack;
    serviceStack: MiraServiceStack;
    stackName: string;
    stacks: MiraStackList;
    static cliArgs: any;
    constructor();
    /**
     * Load a single stack given the filename
     * @param {String} fileName (Optional) Can provide an arbitary name to
     * lookup if name exists in configs.
     */
    getStack(fileName: string): Promise<MiraValidStack | boolean>;
    /**
     * Loads the stacks
     * @param {String} stackName (Optional) Can provide an arbitary name to
     * lookup if name exists in configs.
     */
    getStacks(): Promise<MiraStackList>;
    /**
     * Gets the stack file from CLI.
     */
    static getStackFiles(): Array<string>;
    /**
     * Gets the stack name from CLI.
     */
    static getStackName(): string;
    static getBaseStackName(suffix?: string): string;
    static getBaseStackNameFromParams(prefix: string, name: string, suffix?: string): string;
    /**
     * Initializes the app and stack.
     */
    initialize(): Promise<void>;
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp(): void;
    static isVerbose(): boolean;
}
export {};
