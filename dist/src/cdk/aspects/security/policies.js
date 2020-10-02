"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Policies = void 0;
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_sqs_1 = require("@aws-cdk/aws-sqs");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const aws_ec2_1 = require("@aws-cdk/aws-ec2");
const aws_sns_1 = require("@aws-cdk/aws-sns");
;
/**
 * The Policy class is used by Mira to validate policy aspects of various cloud services.
 */
class Policies {
    constructor(customList) {
        /**
         * reasons why to exclude some actions from validation:
         *
         * https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazonmobileanalytics.html
         * https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-certificatemanager/lib/dns-validated-certificate.ts
         *
         * @ignore - Excluded from documentation generation.
         */
        this.allowedServices = [
            'mobileanalytics:PutEvents',
            'cognito-idp:CreateUserPool',
            'secretsmanager:GetRandomPassword',
            'ec2:AllocateAddress',
            'ec2:AssociateRouteTable',
            'ec2:AttachInternetGateway',
            'ec2:CreateInternetGateway',
            'ec2:CreateNatGateway',
            'ec2:CreateRoute',
            'ec2:CreateRouteTable',
            'ec2:CreateSecurityGroup',
            'ec2:CreateSubnet',
            'ec2:CreateVpc',
            'ec2:DeleteNatGateway',
            'ec2:DeleteSubnet',
            'ec2:DeleteVpc',
            'ec2:Describe*',
            'ec2:DetachInternetGateway',
            'ec2:DisassociateAddress',
            'ec2:DisassociateRouteTable',
            'ec2:ModifySubnetAttribute',
            'ec2:ModifyVpcAttribute',
            'ec2:ReleaseAddress',
            'ecr:GetAuthorizationToken',
            'acm:RequestCertificate',
            'acm:DescribeCertificate',
            'acm:DeleteCertificate',
            'acm:ListCertificates',
            'route53:GetChange',
            'route53:ListResourceRecordSets',
            'cloudfront:GetInvalidation',
            'cloudfront:CreateInvalidation',
            'personalize:CreateSchema',
            'personalize:DeleteSchema',
            'personalize:CreateDatasetGroup',
            'personalize:DeleteDatasetGroup',
            'personalize:CreateDataset',
            'personalize:DeleteDataset',
            'personalize:CreateDatasetImportJob'
        ];
        /**
         * The list of services that supports policyDocument
         *
         * @ignore - Excluded from documentation generation.
         */
        this.policiesResourceType = [
            aws_sqs_1.CfnQueuePolicy.CFN_RESOURCE_TYPE_NAME,
            aws_s3_1.CfnBucketPolicy.CFN_RESOURCE_TYPE_NAME,
            aws_iam_1.CfnManagedPolicy.CFN_RESOURCE_TYPE_NAME,
            aws_iam_1.CfnPolicy.CFN_RESOURCE_TYPE_NAME,
            aws_ec2_1.CfnVPCEndpoint.CFN_RESOURCE_TYPE_NAME,
            aws_sns_1.CfnTopicPolicy.CFN_RESOURCE_TYPE_NAME
        ];
        if (customList) {
            this.allowedServices = customList;
        }
    }
    /**
     *
     * @ignore - Excluded from documentation generation.
     */
    actionsAllowed(actions) {
        return actions.filter((action) => !this.allowedServices.includes(action)).length === 0;
    }
    visit(node) {
        var _a;
        // The check is done using the `cfnResourceType`.
        // NOTE: The original check was done with a `instanceof CfnPolicy`. That check always returned false,
        // probably caused by a conflict with the import of the file from 2 different `node_module` places
        if ('cfnResourceType' in node && this.policiesResourceType.includes(node.cfnResourceType) && ((_a = node.policyDocument) === null || _a === void 0 ? void 0 : _a.statements)) {
            const statements = node.policyDocument.statements;
            statements.forEach(statement => {
                const statementJson = statement.toJSON();
                const resource = Array.isArray(statementJson.Resource) ? statementJson.Resource : [statementJson.Resource];
                const action = Array.isArray(statementJson.Action) ? statementJson.Action : [statementJson.Action];
                resource.forEach((resource) => {
                    if (resource === '*' && !this.actionsAllowed(action)) {
                        node.node.addError('Unqualified asterisks are not allowed in resource specification for policies');
                    }
                });
            });
        }
    }
}
exports.Policies = Policies;
//# sourceMappingURL=policies.js.map