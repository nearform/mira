/**
 * IMPORTANT: do not use external packages here that are not bundled
 */
interface SendResponseOptions {
    status: string;
    requestId: string;
    stackId: string;
    reason: string;
    logicalResourceId: string;
    physicalResourceId: string;
    data: object;
}
/**
 * See the AWS documentation for more information on what needs to be contained in the
 * response of a custom resource.
 *
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-responses.html
 */
export declare const sendResponse: (responseUrl: string, options: SendResponseOptions) => Promise<void>;
export {};
