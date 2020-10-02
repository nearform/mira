/// <reference types="jest" />
declare const mockDeleteBucket: jest.Mock<any, any>;
declare const mockSendResponse: jest.Mock<any, any>;
declare const handler: any;
declare const eventBase: {
    ResponseURL: string;
    LogicalResourceId: string;
    StackId: string;
    RequestId: string;
    ResourceProperties: {
        BucketName: string;
    };
};
