import { RoleConfig } from './utils';
interface NetworkConfig {
    readonly withDomain: boolean;
    readonly baseDomain?: string;
    readonly webAppUrl?: string;
    readonly parameterPrefix: string;
    readonly vpcId?: string;
}
interface RepoConfig {
    readonly provider: string;
    readonly name: string;
    readonly url: string;
    readonly branch: string;
    readonly gitHubTokenSecretArn?: string;
    readonly codeCommitUserPublicKey?: string;
}
/** @ignore - Excluded from documentation generation. */
declare enum Deployment {
    CICD = "CICD",
    DomainManager = "DomainManager",
    Application = "Application"
}
export interface ApplicationDetails {
    readonly stackName: string;
    readonly isDeveloperMode: boolean;
    readonly role: RoleConfig;
    readonly network: NetworkConfig;
    readonly requireManualApproval: boolean;
}
export interface CICDDetails {
    readonly stackName: string;
    readonly role: RoleConfig;
    readonly repo: RepoConfig;
    readonly buildspecFilename: string;
    readonly steps: ApplicationDetails[];
}
export interface DomainManagerDetails {
    readonly stackName: string;
    readonly role: RoleConfig;
    readonly hostedZoneId: string;
}
/**
 * Stores all the required data for one self-contained deployment job
 */
export default class MiraConfig {
    readonly deployment: Deployment;
    readonly environment: string;
    readonly target: string;
    readonly details: CICDDetails | DomainManagerDetails | ApplicationDetails;
    constructor(deploymentCmd?: string, environment?: string);
}
export {};
