/// <reference types="node" />
import { ParsedArgs } from 'minimist';
import { spawn } from 'child_process';
import { MiraApp } from './app';
import { Account } from '../config/mira-config';
import CloudFormation, { StackEvent } from 'aws-sdk/clients/cloudformation';
import ErrorLogger from '../error-logger';
declare type ValidAwsContruct = CloudFormation;
/**
 * @class Responsible for beaming up bits to AWS.  Teleportation device not
 * included.
 */
export declare class MiraBootstrap {
    app: MiraApp;
    spawn: typeof spawn;
    args: ParsedArgs;
    env: string;
    profile: string;
    cdkCommand: string;
    docsifyCommand: string;
    stackFile: string;
    errorLogger: ErrorLogger;
    constructor();
    /**
     * Orchestration used for deployment of the given application. This is used whenever developer or CI will try to
     * deploy application. It is important to keep this function as a single place for application deployment so, development environment
     * will have the same deployment process as CI owned environments.
     *
     * @param undeploy
     */
    deploy(undeploy?: boolean): Promise<void>;
    /**
     * Orchestration for `npx mira cicd` command. As an effect, CodePipeline and related services will be deployed together
     * with permission stacks deployed to the target accounts.
     */
    deployCi(): Promise<void>;
    /**
     * Runs docsify web server with the mira docs.
     */
    runDocs(): void;
    /**
     * TODO: check this functionality together with sample app that supports custom domain.
     */
    deployDomain(): void;
    /**
     * Gets the arguments parsed by the app file provided for the CDK CLI.
     * @param filename - main application file.
     * @param isCi - when "npx mira cicd" command is executed permissions file path is taken from the config.file, NOT from the CLI param.
     * @param env - name of current target environment where the stack with role is going to be deployed.
     */
    getCDKArgs(filename: string, isCi?: boolean, env?: string): string;
    /**
     * Gets the arguments for this stack. It has built-in support for osx/win support.
     */
    getArgs(): string[];
    /**
     * Gets the profile given the env.
     */
    getProfile(environment: string): string | void;
    /**
     * Verifies wether files provided in the CLI exists.
     */
    areStackFilesValid(): Promise<boolean>;
    /**
     * Function being called when CLI is invoked.
     */
    initialize(): Promise<void>;
    /**
     * Shows help for the CDK.
     */
    showHelp(): ParsedArgs;
    /**
     * Undeploys a stack.  This calls deploy with the undeploy parameter.  The
     * only reason to do this is that both calls share almost identical code.
     */
    undeploy(): Promise<void>;
    /**
     * Changes context to use dev config if available, and runs passed function.
     * Typical usecase for this function is to set Dev environment in the context of Mira executable.
     * In case of CDK executions 'dev' is set as NODE_ENV during spawn.
     * @param fn
     * @param params
     */
    useDevConfig<R, Z>(fn: (args: R) => Z, params: [R]): Z;
    getServiceStackName(account: Account): string;
    static getServiceStackName(account: Account): string;
    getAwsSdkConstruct(construct: string, account: Account): ValidAwsContruct;
    getFirstFailedNestedStackName(account: Account, stackName: string): Promise<string | undefined>;
    extractNestedStackError(): Promise<StackEvent[]>;
    filterStackErrorMessages(errors: StackEvent[]): StackEvent[];
    formatNestedStackError(item: StackEvent): string;
    printExtractedNestedStackErrors(): Promise<void>;
    transpile(): Promise<string | undefined>;
}
export {};
