## AWS Titus App
[TITUS](https://nf-titus.netlify.app/#/) is a development and deployment stack for SaaS applications that encapsulates best practice and supports rapid innovation.

Using TITUS across the organisation drives consistency while accelerating project set-up and deployment. Even unskilled cloud developers can rapidly get from project kick-off to feature development without understanding all of the underlying cloud services.

TITUS provides excellent developer experience throughout projects and allows rapid on-boarding of new developers.

### Overview
This sample application uses many AWS services and can be used as a reference to create a complex infrastructure using Mira.

An high level description of TITUS can be summarized with:

- React frontend
- Api service
- Authentication with Cognito
- Data storage on RDS Postgres

The schema below shows the deployed architecture:

![titus infrastructure](./img/infra.png#hla)

The web stack contains a React.js [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application) which provides the UI.

The application has a single entry point through CloudFront that manage the routing serving static files from an S3 Bucket and the api calls from the Api Gateway.

The Api service runs on Ecs Fargate container service with a Network Load Balancer (NLB) and an Autoscaling.

The Authentication is managed by Api Gateway through a Cognito UserPool. 

The Api Gateway is connected to NLB using a Vpc Private Link. 
NLB and Fargate instances are not accessible from the public network. Can be accessed only by the Api Gateway.

A DNS entry is created in Route53 and a certificate is assigned to the endpoint to allow https connection.

### Resources deployed

The stack is split in 4 nested stack:

- Core
- Ecs
- ApiGateway
- WebApp

#### Core
This stack contains the base resource required by the application

- [Vpc](https://docs.aws.amazon.com/vpc)
- [Rds](https://docs.aws.amazon.com/rds)
- [Cognito](https://docs.aws.amazon.com/cognito/)

#### Ecs
This stack contains the Ecs/Fargate infrastructure

- [Ecs](https://docs.aws.amazon.com/ecs/)
- [Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing)
- [Ec2 Autoscaling](https://docs.aws.amazon.com/autoscaling/)

#### Ecs
This stack contains the Ecs/Fargate infrastructure

- [Ecs](https://docs.aws.amazon.com/ecs/)
- [Ecr](https://docs.aws.amazon.com/ecr/)
- [Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing)
- [Ec2 Autoscaling](https://docs.aws.amazon.com/autoscaling/)

#### Api Gateway
This stack contains the Api Gateway configuration connected to The NLB through a VpcLink. It creates a lambda function as well, used by the Frontend to retrieve the configuration data. 

- [Api Gateway](https://docs.aws.amazon.com/apigateway)
- [Lambda](https://docs.aws.amazon.com/lambda)

#### Web App
This stack contains the CloudFront configuration, the DNS creation and the storage for the Front End application. 

- [Cloud Front](https://docs.aws.amazon.com/cloudfront)
- [S3](https://docs.aws.amazon.com/s3)
- [Route 53](https://docs.aws.amazon.com/route53)
- [Certificate manager](https://docs.aws.amazon.com/acm)

## Deploy with Mira

### Prerequisites

To deploy the stack the SSL Certificate and the Docker Repository (ECR) should exists and contains the `latest` image.

#### SSL Certificate
The SSL Certificate can be requested from the AWS dashboard:

https://console.aws.amazon.com/acm/home?region=us-east-1#/

or using the AWS CLI command
 
```AWS_REGION=us-east-1 aws acm request-certificate --domain-name *.yourdomain.com```

**Certificate Requirement**
The certificate will be connected to a CloudFront deployment then it requires to be requested in `us-east-1`

https://aws.amazon.com/it/premiumsupport/knowledge-center/custom-ssl-certificate-cloudfront/

> To assign an ACM certificate to a CloudFront distribution, you must request or import the certificate in the US East (N. Virginia) Region. If you're using the ACM console, check the Region selector in the navigation bar. Confirm that US East (N. Virginia) is selected before you request or import the certificate.
>
> Note: After you assign an ACM certificate to a CloudFront distribution, the certificate is distributed to all edge locations for the CloudFront distribution's price class.
  

#### Docker repository (ECR)

Create the repository if not exists:

```aws ecr create-repository --repository-name awsEcrRepositoryName```

Create and deploy the image:

```docker build -t AWS_ECR_REPOSITORY_NAME .```
```docker tag AWS_ECR_REPOSITORY_NAME:latest YOUR_ACCOUNT_NUMBER.dkr.ecr.YOUR_REGION.amazonaws.com/AWS_ECR_REPOSITORY_NAME:latest```
```docker push YOUR_ACCOUNT_NUMBER.dkr.ecr.YOUR_REGION.amazonaws.com/AWS_ECR_REPOSITORY_NAME:latest```

Once the infrastructure is deployed the Docker image can be updated with the command:

```aws ecs update-service --service SERVICE_NAME --cluster CLUSTER_NAME --force-new-deployment``` 

### Config file
A config file named `default.json` should be placed in `packages/titus-infra/config` folder

```
{
  "app": {
    "prefix": "nf",
    "name": "titus-app"
  },
  "dev": {
    "target": "default"
  },
  "accounts": {
    "default": {
      "env": {
        "account": "YOURACCOUNTNUMEBER", // Check below to get it from CLI
        "region": "eu-west-1",  // The deployment region
        "domainName": "yourdomain.com", // The base domain name
        "webAppUrl": "www.yourdomain.com", // The web app url 
        "certificateSslName": "*.yourdomain.com", // The certificate, check below how to request a certifcate
        "awsEcrRepositoryName": "yourname-titus-backend" // The ECR docker repository
      },
      "profile": "default" // The profile used defined in ~.aws/credentials
    }
  }
}
```

### Deploy
Deploy the application run the commands:

```
npm run build:all
npm run deploy
```

The `npm run deploy` command run a check before the actual deploy. It verify the validity of the config and the prerequisites.

Once deployed a test user can be created with a tool command located in `packages/titus-infra/scripts`

A CLI tool is available to create a user in the current cognito deploy
 
```node scripts/createUser.js --email davide.fiorello@nearform.com --password YOUR_PASSWORD```

