export interface RoleConfig {
    readonly profile: string;
    readonly account: string;
    readonly region: string;
}
/**
 * It is important that we disallow undefined here, otherwise resource name collisions may occur
 * @internal
 */
export declare function nameResource(namespace: string, ...subNames: string[]): string;
export interface EnvData {
    readonly name: string;
    readonly profile: string;
    readonly withDomain?: boolean;
    readonly baseDomain?: string;
    readonly webAppUrl?: string;
    readonly requireManualApproval?: boolean;
    readonly hostedZoneId?: 'string';
}
export interface Domain {
    readonly baseDomain: string;
    readonly webAppUrl: string;
}
/**
 * In developer mode build using a sub-domain of the base domain. Otherwise, parse the base domain from the web app URL.
 * @internal
 */
export declare function getUrl(envData: EnvData, isDeveloperMode: boolean, stackName: string): Domain;
/**
 * FIXME: maybe there is a less hacky way to do this?
 * https://stackoverflow.com/questions/44433527/how-to-load-config-from-aws-config
 * @internal
 */
export declare function loadAWSProfile(profile: string): RoleConfig;
export declare function loadEnvironment(name: string): EnvData;
