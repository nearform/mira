import { Construct, Stack } from '@aws-cdk/core';
import { Role } from '@aws-cdk/aws-iam';
export interface DeploymentPermissionsProps {
    env: string;
}
export declare class DeploymentPermissions extends Stack {
    role: Role;
    constructor(parent: Construct, props?: DeploymentPermissionsProps);
}
