import { Construct, Duration, RemovalPolicy, Stack, Token, Tokenization } from '@aws-cdk/core'
import { Connections, ISecurityGroup, IVpc, Port, SecurityGroup, SubnetSelection } from '@aws-cdk/aws-ec2'
import { CfnDBCluster, CfnDBSubnetGroup, DatabaseSecret, Endpoint } from '@aws-cdk/aws-rds'
import {
  AttachmentTargetType,
  ISecretAttachmentTarget,
  SecretAttachmentTargetProps,
  SecretTargetAttachment, SecretRotation, SecretRotationApplication
} from '@aws-cdk/aws-secretsmanager'

// Initially based on https://github.com/aws/aws-cdk/issues/929#issuecomment-516511171

// AWS Regions list that supports serverless Postgres aurora.  List should be curated based on https://aws.amazon.com/rds/aurora/pricing/

const supportedRegions = [
  'ap-northeast-1',
  'eu-west-1',
  'us-east-1',
  'us-east-2',
  'us-west-2'
]

export interface ServerlessAuroraProps {
  readonly databaseName: string
  readonly masterUsername?: string
  readonly maxCapacity: number
  readonly securityGroup?: ISecurityGroup
  readonly subnets: SubnetSelection
  readonly vpc: IVpc
}

export class ServerlessAurora extends Construct implements ISecretAttachmentTarget {
  public securityGroupId: string
  public clusterIdentifier: string
  public clusterEndpoint: Endpoint
  public secret?: SecretTargetAttachment
  public connections: Connections
  public vpc: IVpc
  public vpcSubnets: SubnetSelection
  public securityGroup: ISecurityGroup

  constructor (scope: Construct, id: string, props: ServerlessAuroraProps) {
    super(scope, id)

    const { region/*, stackName */ } = Stack.of(this)
    const isTestRegion = region.startsWith('test-')
    const isToken = Tokenization.isResolvable(region)
    if (!isToken && !isTestRegion && !supportedRegions.includes(region + '')) {
      // The stackName is not available at this stage if the root stack is intherith from a MiraStack.
      // Requires a further investigation on the token resolution process.
      // In this specific case is not important to have the StackName than the resolution is postponed
      // throw new Error(`The region (${region}) used for ${stackName} does not support Amazon Aurora serverless PostreSQL.  Please change the default region in the AWS credentials file, use another profile, or update cdk.json.  Supported regions are: ${supportedRegions.join(', ')}.`)
      throw new Error(`The region (${region}) used does not support Amazon Aurora serverless PostreSQL.  Please change the default region in the AWS credentials file, use another profile, or update cdk.json.  Supported regions are: ${supportedRegions.join(', ')}.`)
    }

    this.vpc = props.vpc
    this.vpcSubnets = props.subnets

    const secret = new DatabaseSecret(this, 'MasterUserSecret', {
      username: props.masterUsername || 'root'
    })

    const securityGroup = props.securityGroup || new SecurityGroup(this, 'DatabaseSecurityGroup', {
      allowAllOutbound: true,
      description: 'DB Cluster Mira security group',
      vpc: props.vpc
    })
    this.securityGroup = securityGroup
    this.securityGroupId = securityGroup.securityGroupId

    const cluster = new CfnDBCluster(this, 'DatabaseCluster', {
      databaseName: props.databaseName,

      engine: 'aurora-postgresql',
      engineMode: 'serverless',
      engineVersion: '10.7',

      masterUsername: secret.secretValueFromJson('username').toString(),
      masterUserPassword: secret.secretValueFromJson('password').toString(),

      dbSubnetGroupName: new CfnDBSubnetGroup(this, 'db-subnet-group', {
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
    })
    cluster.applyRemovalPolicy(RemovalPolicy.DESTROY, { applyToUpdateReplacePolicy: true })

    this.clusterIdentifier = cluster.ref
    // create a number token that represents the port of the cluster
    const portAttribute = Token.asNumber(cluster.attrEndpointPort)
    this.clusterEndpoint = new Endpoint(cluster.attrEndpointAddress, portAttribute)

    if (secret) {
      this.secret = secret.addTargetAttachment('AttachedSecret', { target: this })
    }
    const defaultPort = Port.tcp(this.clusterEndpoint.port)
    this.connections = new Connections({ securityGroups: [securityGroup], defaultPort })
  }

  /**
   * Adds the single user rotation of the master password to this cluster.
   * @param id {string}
   * @param duration {Duration} - The duration of the rotation, if null the default of 30 days is used
   */
  public addRotationSingleUser (id: string, duration?: Duration): SecretRotation {
    if (!this.secret) {
      throw new Error('Cannot add single user rotation for a cluster without secret.')
    }
    return new SecretRotation(this, id, {
      secret: this.secret,
      vpc: this.vpc,
      vpcSubnets: this.vpcSubnets,
      target: this,
      application: SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      automaticallyAfter: duration || undefined
    })
  }

  public asSecretAttachmentTarget (): SecretAttachmentTargetProps {
    return {
      targetId: this.clusterIdentifier,
      targetType: AttachmentTargetType.CLUSTER
    }
  }
}
