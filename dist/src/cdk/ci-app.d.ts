import * as cdk from '@aws-cdk/core';
import * as aws from 'aws-sdk';
import { MiraValidStack } from './app';
/**
 * Main Mira class.  Bootstraps CDK and loads in Stacks per user input.
 */
export declare class MiraCiApp {
    cdkApp: cdk.App;
    instance: MiraCiApp;
    stackName: string;
    stacks: Array<MiraValidStack>;
    constructor();
    /**
     * Initializes the app and stack.
     */
    initialize(): Promise<void>;
    getCallerIdentityResponse(profile: string): Promise<aws.STS.Types.GetCallerIdentityResponse>;
    /**
     * Initializes the app.  Not much else to see here.
     */
    initializeApp(): void;
    private parsePipelineEnvironmentVariables;
}
