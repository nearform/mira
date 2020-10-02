"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessAurora = void 0;
const core_1 = require("@aws-cdk/core");
const aws_ec2_1 = require("@aws-cdk/aws-ec2");
const aws_rds_1 = require("@aws-cdk/aws-rds");
const aws_secretsmanager_1 = require("@aws-cdk/aws-secretsmanager");
// Initially based on https://github.com/aws/aws-cdk/issues/929#issuecomment-516511171
/**
 * AWS Regions list that supports serverless Postgres aurora.
 * List should be curated based on https://aws.amazon.com/rds/aurora/pricing/
 *
 * @ignore - Excluded from documentation generation.
 */
const supportedRegions = [
    'ap-northeast-1',
    'eu-west-1',
    'us-east-1',
    'us-east-2',
    'us-west-2'
];
/**
 * A Construct representing a Serverless Aurora Database for use with Mira
 */
class ServerlessAurora extends core_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const { region /*, stackName */ } = core_1.Stack.of(this);
        const isTestRegion = region.startsWith('test-');
        const isToken = core_1.Tokenization.isResolvable(region);
        if (!isToken && !isTestRegion && !supportedRegions.includes(region + '')) {
            // The stackName is not available at this stage if the root stack is inherited from a MiraStack.
            // Requires a further investigation on the token resolution process.
            // In this specific case is not important to have the StackName than the resolution is postponed
            // throw new Error(`The region (${region}) used for ${stackName} does not support Amazon Aurora serverless PostgreSQL.
            // Please change the default region in the AWS credentials file, use another profile, or update cdk.json.
            // Supported regions are: ${supportedRegions.join(', ')}.`)
            throw new Error(`The region (${region}) used does not support Amazon Aurora serverless PostgreSQL.  Please change the default region in the AWS credentials file, use another profile, or update cdk.json.  Supported regions are: ${supportedRegions.join(', ')}.`);
        }
        this.vpc = props.vpc;
        this.vpcSubnets = props.subnets;
        const secret = new aws_rds_1.DatabaseSecret(this, 'MasterUserSecret', {
            username: props.masterUsername || 'root'
        });
        const securityGroup = props.securityGroup || new aws_ec2_1.SecurityGroup(this, 'DatabaseSecurityGroup', {
            allowAllOutbound: true,
            description: 'DB Cluster Mira security group',
            vpc: props.vpc
        });
        this.securityGroup = securityGroup;
        this.securityGroupId = securityGroup.securityGroupId;
        const cluster = new aws_rds_1.CfnDBCluster(this, 'DatabaseCluster', {
            databaseName: props.databaseName,
            engine: 'aurora-postgresql',
            engineMode: 'serverless',
            engineVersion: '10.7',
            masterUsername: secret.secretValueFromJson('username').toString(),
            masterUserPassword: secret.secretValueFromJson('password').toString(),
            dbSubnetGroupName: new aws_rds_1.CfnDBSubnetGroup(this, 'db-subnet-group', {
                dbSubnetGroupDescription: 'Mira database cluster subnet group',
                subnetIds: props.vpc.selectSubnets(props.subnets).subnetIds
            }).ref,
            vpcSecurityGroupIds: [securityGroup.securityGroupId],
            storageEncrypted: true,
            // Maximum here is 35 days
            backupRetentionPeriod: 35,
            scalingConfiguration: {
                autoPause: true,
                secondsUntilAutoPause: 300,
                minCapacity: 8,
                maxCapacity: props.maxCapacity
            }
        });
        cluster.applyRemovalPolicy(core_1.RemovalPolicy.DESTROY, { applyToUpdateReplacePolicy: true });
        this.clusterIdentifier = cluster.ref;
        // create a number token that represents the port of the cluster
        const portAttribute = core_1.Token.asNumber(cluster.attrEndpointPort);
        this.clusterEndpoint = new aws_rds_1.Endpoint(cluster.attrEndpointAddress, portAttribute);
        if (secret) {
            this.secret = secret.addTargetAttachment('AttachedSecret', { target: this });
        }
        const defaultPort = aws_ec2_1.Port.tcp(this.clusterEndpoint.port);
        this.connections = new aws_ec2_1.Connections({ securityGroups: [securityGroup], defaultPort });
    }
    /**
     * Adds the single user rotation of the master password to this cluster.
     * @param id {string}
     * @param duration {Duration} - The duration of the rotation, if null the default of 30 days is used
     */
    addRotationSingleUser(id, duration) {
        if (!this.secret) {
            throw new Error('Cannot add single user rotation for a cluster without secret.');
        }
        return new aws_secretsmanager_1.SecretRotation(this, id, {
            secret: this.secret,
            vpc: this.vpc,
            vpcSubnets: this.vpcSubnets,
            target: this,
            application: aws_secretsmanager_1.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
            automaticallyAfter: duration || undefined
        });
    }
    asSecretAttachmentTarget() {
        return {
            targetId: this.clusterIdentifier,
            targetType: aws_secretsmanager_1.AttachmentTargetType.CLUSTER
        };
    }
}
exports.ServerlessAurora = ServerlessAurora;
//# sourceMappingURL=serverless-aurora.js.map