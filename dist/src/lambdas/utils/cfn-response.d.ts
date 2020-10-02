import { Context } from 'aws-lambda';
export interface LambdaEvent {
    StackId: string;
    RequestId: string;
    LogicalResourceId: string;
    ResponseURL: string;
    RequestType: string;
    ResourceProperties: {
        Source: string;
        Target: string;
    };
    OldResourceProperties: {
        Source: string;
        Target: string;
    };
}
export interface ResponseData {
    Arn?: string;
}
export declare function send(event: LambdaEvent, context: Context, responseStatus: string, responseData: ResponseData, physicalResourceId?: string, noEcho?: boolean): Promise<string>;
