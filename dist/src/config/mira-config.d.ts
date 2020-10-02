export interface Config {
    app: App;
    dev: Dev;
    accounts: {
        [x: string]: Account;
    };
    cicd?: CicdConfig;
    domain?: DomainConfig;
}
interface App {
    prefix: string;
    name: string;
}
interface Dev {
    target: string;
}
export interface AccountEnvData {
    account: string;
    region: string;
}
export interface Account {
    readonly name: string;
    readonly profile?: string;
    readonly env: AccountEnvData;
}
export interface Stage {
    readonly target: string;
    readonly withDomain?: boolean;
    readonly requireManualApproval: boolean;
}
export interface CiProps {
    readonly target: string;
    readonly withDomain?: string;
    readonly requireManualApproval?: boolean;
    readonly account: Account;
}
interface CicdConfig {
    readonly account: Account;
    readonly permissionsFile: string;
    readonly provider: string;
    readonly repositoryUrl: string;
    readonly branchName: string;
    readonly gitHubTokenSecretArn?: string;
    readonly codeCommitUserPublicKey?: string;
    readonly buildspecFile: string;
    readonly accounts: string[];
    readonly repositoryOwner: string;
    readonly repositoryName: string;
}
export interface DomainConfig {
    readonly hostedZoneId?: string;
    readonly accounts: string[];
}
/**
 * This class represents the loaded Mira Configuration as defined by default.json
 * and its overrides (dev.json).
 *
 * @class MiraConfigClass
 */
declare class MiraConfigClass {
    /**
     * The project name comes from the `app.name` property of the default.json configuration file.
     * It represents the name of the application being deployed.
     */
    readonly projectName: string;
    /**
     * The project prefix comes from the `app.prefix` property of the default.json configuration file.
     * It represents a prefix added to the application name (eg prefix-name) during deployment.
     */
    readonly projectPrefix: string;
    constructor();
    /**
     * Stores a reference to the environment name we will be deploying to.
     * The name should be one of the accounts listed in the configuration file
     * `accounts` object.
     */
    defaultEnvironmentName: string;
    setDefaultEnvironmentName(name: string): void;
    getEnvironment(name?: string): Account;
    getEnvironmentWithCiProps(name?: string): CiProps;
    getBaseStackName(suffix?: string): string;
    calculateCertificateStackName(): string;
    calculateRepositoryName(): string;
    getCICDAccounts(): Account[];
    getPermissionsFilePath(): string;
    getCICDConfig(): CicdConfig;
    getDomainConfig(): DomainConfig;
    getDomainAllowedPrincipals(): Account[];
    calculateSharedResourceName(resource: string): string;
    private getFullCiProps;
    private getFullAccountProps;
    private getTargetName;
    getCostCenter(): string;
}
export declare const MiraConfig: MiraConfigClass;
export {};
