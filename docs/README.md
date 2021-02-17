![logo]

### What is Mira?

The Mira Accelerator fast-tracks the setup of common Amazon Web Services (AWS) Serverless infrastructure<sup>1</sup>. 
It is an opinionated toolkit on top of the AWS Cloud Development Kit.

It enables you to:
- Quickly bootstrap serverless, cloud native AWS applications.
- Set up a CI platform that is configured and ready to use.
- Shortcut a lot of technical decisions; Mira makes them for you.

Mira consists of the following built-ins:

 * A Command Line Interface, that helps to initialise and deploy applications, and also to deploy a CI pipeline.
 * Foundational constructs that simplify configuration of multiple application environments.
 * An opinionated set of AWS CDK aspects, e.g. IAM Policy validator. 
 * Complementary sample applications e.g. a simple S3-based web hosting app.
 
__Note: Currently supported version of the AWS CDK is: *[1.89.0](https://github.com/aws/aws-cdk/releases/tag/v1.89.0)*.__
 
Please make sure your application depends on that exact version of the CDK.
  
> <sup>1</sup> AWS Serverless infrastructure is a set of services with abstracted servers that are fully managed by AWS.
> The benefits of a serverless infrastructure are:
> * Pay-per-use of resources 
> * Managed scaling
> * Managed availability
> * Managed security
> * Ease of use

[Quick Start Guide]: quick-start/
[Mira Overview]: overview/

<!-- Images -->
[logo]: img/Accel_Logo_Mira.svg
