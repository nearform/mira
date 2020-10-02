import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as aws from 'aws-sdk';
export interface PipelineEnvironmentVariable {
    key: string;
    value: string;
}
export interface CicdProps extends StackProps {
    callerIdentityResponse: aws.STS.Types.GetCallerIdentityResponse;
    environmentVariables: PipelineEnvironmentVariable[];
}
export declare class Cicd extends Stack {
    private readonly pipeline;
    private readonly pipelineEnvironment;
    constructor(parent: Construct, props: CicdProps);
    /**
     * Function that parse AWS.STS.getCallerIdentity and returns referenced Role or User
     * @param callerIdentityResponse
     */
    private getCallerIdentity;
    private getSourceAction;
    private addDeployStage;
    private getDeployRoleArn;
}
