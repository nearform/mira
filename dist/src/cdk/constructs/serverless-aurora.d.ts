import { Construct, Duration } from '@aws-cdk/core';
import { Connections, ISecurityGroup, IVpc, SubnetSelection } from '@aws-cdk/aws-ec2';
import { Endpoint } from '@aws-cdk/aws-rds';
import { ISecretAttachmentTarget, SecretAttachmentTargetProps, SecretTargetAttachment, SecretRotation } from '@aws-cdk/aws-secretsmanager';
export interface ServerlessAuroraProps {
    readonly databaseName: string;
    readonly masterUsername?: string;
    readonly maxCapacity: number;
    readonly securityGroup?: ISecurityGroup;
    readonly subnets: SubnetSelection;
    readonly vpc: IVpc;
}
/**
 * A Construct representing a Serverless Aurora Database for use with Mira
 */
export declare class ServerlessAurora extends Construct implements ISecretAttachmentTarget {
    securityGroupId: string;
    clusterIdentifier: string;
    clusterEndpoint: Endpoint;
    secret?: SecretTargetAttachment;
    connections: Connections;
    vpc: IVpc;
    vpcSubnets: SubnetSelection;
    securityGroup: ISecurityGroup;
    constructor(scope: Construct, id: string, props: ServerlessAuroraProps);
    /**
     * Adds the single user rotation of the master password to this cluster.
     * @param id {string}
     * @param duration {Duration} - The duration of the rotation, if null the default of 30 days is used
     */
    addRotationSingleUser(id: string, duration?: Duration): SecretRotation;
    asSecretAttachmentTarget(): SecretAttachmentTargetProps;
}
