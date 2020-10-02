/**
 * See the AWS documentation for more information passed in the request for a custom resource.
 *
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
 */
export interface CustomResourceProviderRequest<T1, T2> {
    RequestType: 'Create' | 'Update' | 'Delete';
    ResponseURL: string;
    StackId: string;
    RequestId: string;
    ResourceType: string;
    LogicalResourceId: string;
    ResourceProperties: T1;
    OldResourceProperties: T2;
}
interface Properties {
    UserName: string;
    SSHPublicKeyBody: string;
}
export declare const handler: (event: CustomResourceProviderRequest<Properties, Properties>) => Promise<void>;
export {};
