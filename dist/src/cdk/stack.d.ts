import * as cdk from '@aws-cdk/core';
import { NestedStack } from '@aws-cdk/aws-cloudformation';
import { Construct, Stack } from '@aws-cdk/core';
import { IStringParameter, StringParameter } from '@aws-cdk/aws-ssm';
import { MiraApp } from './app';
/**
 * The main Mira stack.  Responsible for provisioning IAM role / CodePipeline.
 * There is a 1:1 relationship between the service stack and the app.  This
 * makes provisioning a CICD more organized within a single app and keeps the
 * CloudFormation stack listing likewise de-cluttered.
 */
export declare class MiraServiceStack extends cdk.Stack {
    initialized: Promise<unknown>;
    constructor(app: MiraApp, environment: string, suffix?: string);
    /**
     * Applies security policies.
     */
    applyPolicies(customList?: string[]): void;
    /**
     * Initialize this component in some async way.
     */
    initialize(): Promise<unknown>;
}
export interface ExportOutputs {
    addOutput(name: string, value: string, shouldExport: boolean): void;
}
interface MiraStackProps {
    disablePolicies?: boolean;
    approvedWildcardActions?: string[];
    [x: string]: unknown;
}
/**
 * Note that in Mira, a "stack" is always nested within a service context to
 * support CICD out of the box.
 */
export declare class MiraStack extends NestedStack implements ExportOutputs {
    initialized: Promise<unknown>;
    static stackInstances: Record<string, Stack[]>;
    parent: Construct;
    name: string;
    props: MiraStackProps;
    constructor(parent: Construct, name?: string, props?: MiraStackProps);
    /**
   * Adds an output to the stack.
   * @param name
   * @param value
   * @param shouldExport
   */
    addOutput(name: string, value: string, shouldExport?: boolean): void;
    /**
   * Initialize this component in an asynchronous manner.
   */
    initialize(): Promise<unknown>;
    createParameter(fullName: string, description: string, value: string): StringParameter;
    loadParameter(fullName: string): IStringParameter;
    private parseParameterName;
}
export {};
