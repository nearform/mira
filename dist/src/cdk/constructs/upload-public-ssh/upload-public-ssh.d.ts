import { Construct, Resource } from '@aws-cdk/core';
export interface UploadPublicSshProps {
    userName: string;
    publicKey: string;
}
export declare class UploadPublicSsh extends Resource {
    sshPublicKeyId: string;
    constructor(scope: Construct, id: string, props: UploadPublicSshProps);
}
