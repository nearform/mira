/**
 * Allow Mira to assume a role based on a given arn. This is used for deployment
 * and allows Mira to use the account specified in the configuration file.
 *
 * @internal
 * @throws Cannot assume role ${roleArn}: Invalid Role
 * @throws Cannot assume role ${roleArn}: &lt;other reason&gt;
 */
export declare function assumeRole(roleArn: string): Promise<AWS.Config>;
