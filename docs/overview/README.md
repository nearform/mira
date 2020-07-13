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
* [Basic S3 based web hosting app](../samples/README.md?id=s3-web-hosting-app). 

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
  - CICD pipeline with promotion
  - The web app is hosted using S3 and CloudFront
  - Security
    - The web app and API use HTTPS
    - DB data is encrypted at rest and in transit
    - S3 buckets used for CICD pipeline are encrypted

