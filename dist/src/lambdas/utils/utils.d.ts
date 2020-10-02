/**
 * An Enum representing Route 53 Actions
 *
 * @ignore - Excluded from documentation generation.
 */
export declare enum Route53Action {
    UPSERT = "UPSERT",
    CREATE = "CREATE",
    DELETE = "DELETE"
}
export declare class Utils {
    /**
     * implementation based on https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-certificatemanager/lambda-packages/dns_validated_certificate_handler/lib/index.js
     * @param {string} requestId
     * @param {string} domainName
     * @param {string[]} subjectAlternativeNames
     * @param {string} hostedZoneId
     * @param {string} region
     */
    static requestCertificate(requestId: string, domainName: string, subjectAlternativeNames: string[], hostedZoneId: string, region: string, route53Role: string): Promise<string>;
    static deleteCertificate(identifier: string, region: string, route53Role: string): Promise<void>;
    static deleteRecord(source: string, target: string, hostedZone: string): Promise<string | unknown>;
    static changeResourceRecordSets(action: Route53Action, hostedZone: string, source: string, target: string): Promise<unknown>;
}
