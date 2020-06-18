import * as cdk from '@aws-cdk/core'
import { PolicyStatement, CfnManagedPolicy, CfnPolicy, ManagedPolicyProps } from '@aws-cdk/aws-iam'
import { CfnQueuePolicy } from '@aws-cdk/aws-sqs'
import { CfnBucketPolicy } from '@aws-cdk/aws-s3'
import { CfnVPCEndpoint } from '@aws-cdk/aws-ec2'
import { CfnTopicPolicy } from '@aws-cdk/aws-sns'

interface HasPolicyDocument extends cdk.IConstruct {
    policyDocument: ManagedPolicyProps
    cfnResourceType: string
};

export class Policies implements cdk.IAspect {
  constructor (customList?: any) {
    if (customList) {
      this.allowedServices = customList
    }
  }

    /**
     * reasons why to exclude some actions from validation:
     *
     * https://docs.aws.amazon.com/IAM/latest/UserGuide/list_amazonmobileanalytics.html
     * https://github.com/aws/aws-cdk/blob/master/packages/%40aws-cdk/aws-certificatemanager/lib/dns-validated-certificate.ts
     */
    private allowedServices: string[] = [
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
    ]

    /**
     * The list of services that supports policyDocument
     */
    private readonly policiesResourceType: string[] = [
      CfnQueuePolicy.CFN_RESOURCE_TYPE_NAME,
      CfnBucketPolicy.CFN_RESOURCE_TYPE_NAME,
      CfnManagedPolicy.CFN_RESOURCE_TYPE_NAME,
      CfnPolicy.CFN_RESOURCE_TYPE_NAME,
      CfnVPCEndpoint.CFN_RESOURCE_TYPE_NAME,
      CfnTopicPolicy.CFN_RESOURCE_TYPE_NAME
    ]

    private actionsAllowed (actions: string[]): boolean {
      return actions.filter((action: string) => !this.allowedServices.includes(action)).length === 0
    }

    public visit (node: cdk.IConstruct | HasPolicyDocument): void {
      // The check is done using the `cfnResourceType`.
      // NOTE: The original check was done with a `instanceof CfnPolicy`. That check always returned false,
      // probably caused by a conflict with the import of the file from 2 different `node_module` places
      if ('cfnResourceType' in node && this.policiesResourceType.includes(node.cfnResourceType) && node.policyDocument?.statements) {
        const statements: PolicyStatement[] = node.policyDocument.statements

        statements.forEach(statement => {
          const statementJson = statement.toJSON()
          const resource = Array.isArray(statementJson.Resource) ? statementJson.Resource : [statementJson.Resource]
          const action = Array.isArray(statementJson.Action) ? statementJson.Action : [statementJson.Action]
          resource.forEach((resource: string) => {
            if (resource === '*' && !this.actionsAllowed(action)) {
              node.node.addError('Unqualified asterisks are not allowed in resource specification for policies')
            }
          })
        })
      }
    }
}
