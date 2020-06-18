# Mira Overview

## High-Level Architecture

Mira consists of three core elements:
1. A Command Line Interface, that simplifies application bootstrap, deployment and CI pipeline creation.
2. Foundational CDK constructs, that handles naming of your stacks and resources and provides easy way to handle environment  configuration.
3. Sample applications that fast-track setup of common case applications.


Mira enables you to create a dedicated development environment for every developer.
Every stack is managed by AWS CloudFormation.

Developer can select one of available sample applications as a starting position for the new application.

Available sample application are:
* [Basic S3 based web hosting app](/samples/?id=s3-web-hosting-app). 

<!--Depending on the selected sample apps, below diagram reflects resources deployed to the cloud.
![hla]
Fig. 1 Mira High-Level Architecture-->

## Serverless Services

Mira sample apps are using serverless services so that your developers can focus on implementing business logic without needing to address underlying infrastructure challenges. These services take care of low-level aspects like hardware and operating systems, and have built-in scalability.

## Multi-Developer Support

Mira solves the concern of sharing infrastructure between developers by enabling you to create dedicated stacks for each developer. Mira is designed to have immutable infrastructure. 

__Note:__
 The environment name is defined in the configuration file.

## Shared Environments and Continuous Integration

A Well-Architected solution needs a proper delivery pipeline. Mira addresses this by creating a single delivery pipeline that can deploy the application on multiple AWS accounts.

## AWS Cloud Development Kit

 Mira uses the AWS Cloud Development Kit (CDK), which is a software development kit, for defining cloud infrastructure with code and provisioning it through AWS CloudFormation.
 
 Mira supports cross-region deployable applications.
 
 Mira is designed to be extensible. If a new module is needed, you can simply extend `MiraStack`, to inherit helpers and other basic setup.
 
__Note:__
 Mira provides bundled version of the AWS CDK. Keep in mind, all CDK modules have to use the same version.

## Get Started Using Mira
 If you are a developer and you want to get started using Mira, see the [Quick Start Guide](quick-start/). This Guide assumes you already have an existing Mira repository and a existing AWS accounts. 

If you want to start using Mira, but you do not already have a Mira repository or existing AWS accounts, see [Set up Mira for Your Project](forking-mira/) for details.

<!-- You can also review the [Sample Apps](samples/) provided with Mira and select the one you want to deploy to get started. -->

## Other considerations and limitations

 * Security
    * TBD
 * Costs
    * Due to serverless nature of the solution costs of the entire ecosystem depends on the usage. 
 * Tagging
    * TBD
 * Regions support
    * Due to Amazon Aurora Serverless with PostreSQL dialect only the following regions are supported:
        * us-east-1
        * us-east-2
        * us-west-2
        * ap-northeast-1
        * eu-west-1
 * Serverless drawbacks
    * lambda cold start if no previous provisioning or Provisioned Concurrency not used (https://aws.amazon.com/blogs/aws/new-provisioned-concurrency-for-lambda-functions/)
    * Aurora serverless cold start if it's being hibernated


## Key Features

### Mira
  - Developer friendly CLI, simply run `npx mira`.
      - init - option to initialize mandatory files.
      - deploy - option to deploy your application directly from your computer.
      - cicd - option to deploy shared CI Pipeline
      - docs - option to run a docsify webserver and see the Mira docs.
  - `MiraStack` class that is...
### Mira Sample Apps

  - Monorepo using yarn workspaces in sample applications
  - Secrets are stored in secrets manager — DB master password, OAuth GitHub token
  - Serverless Postgres
  - Automatic migration of DB schemas when deployed
  - CICD pipeline with promotion
  - Route53 integration
  - API built with API Gateway and Lambdas
  - Uses SSM to share configuration data between stacks and in the app
  - Web app generates its own certificate using Certificate Manager and a sub domain using Route53
  - The web app is hosted using S3 and CloudFront
  - Security
    - The web app and API use HTTPS
    - DB data is encrypted at rest and in transit
    - S3 buckets used for CICD pipeline are encrypted
    - Secrets are never stored in the repository or environment variables
  - Uses Cognito for authentication
  - Integration (snapshot) tests and unit tests
  

## Common Use Cases
Coming soon...
 -->
<!-- Images -->
[hla]: ../img/hla.png#hla
