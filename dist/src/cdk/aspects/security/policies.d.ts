import * as cdk from '@aws-cdk/core';
import { ManagedPolicyProps } from '@aws-cdk/aws-iam';
interface HasPolicyDocument extends cdk.IConstruct {
    policyDocument: ManagedPolicyProps;
    cfnResourceType: string;
}
/**
 * The Policy class is used by Mira to validate policy aspects of various cloud services.
 */
export declare class Policies implements cdk.IAspect {
    constructor(customList?: string[]);
    /**
     * reasons why to exclude some actions from validation:
     *
     * https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazonmobileanalytics.html
     * https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-certificatemanager/lib/dns-validated-certificate.ts
     *
     * @ignore - Excluded from documentation generation.
     */
    private allowedServices;
    /**
     * The list of services that supports policyDocument
     *
     * @ignore - Excluded from documentation generation.
     */
    private readonly policiesResourceType;
    /**
     *
     * @ignore - Excluded from documentation generation.
     */
    private actionsAllowed;
    visit(node: cdk.IConstruct | HasPolicyDocument): void;
}
export {};
