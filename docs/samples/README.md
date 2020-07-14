# Sample Applications

The Mira Accelerator includes the following sample applications:
- [S3 Web Hosting App](#s3-web-hosting-app)
<!-- - [Cognito 3-Tier Web App](#cognito-3-tier-web-app)-->
<!-- - [Auth0 3-Tier Web App](#auth0-3-tier-web-app)-->
<!-- - [Personalize App](#personalize-app)-->


## S3 Web Hosting App

- [mira-sample-s3-webhosting](https://github.com/nearform/mira-sample-s3-webhosting/generate)

This application is a simple hello world app. This sample app is recommended for project owners who want the benefits of Mira CI orchestration only.

The `infra/src/index.ts` file contains the the full application infrastructure definition.

If the `config/default.json` file is already prepared, simply run `npx mira deploy s3 --file=infra/src/index.ts`
to deploy the application,.

__Note:__ Mira accepts both `.js` and `.ts` files as the entry file. Mira will look for the first `tsconfig.json` file found with `glob` 

Follow the `README.md` file provided in the sample app for full instructions.

## Sample Application Considerations

Consider the following if you wish to modify the sample applications provided with Mira:
* Keep your infrastructure definition and your business logic in separate node modules. Otherwise, when you upload your code into the cloud, the CDK dependencies are also uploaded .
* The CI pipeline depends on the deployment permissions in the file `mira/cicd/deployment-permissions/index.ts`. These permissions are tailor-made for the existing sample applications.
If you modify a sample application, you may need to update this file to reflect your new infrastructure.
* Each sample application has a `buildspec.yaml` file. You may need to adjust your build process to meet your needs.
* When developing a new Lambda, a decision needs to be made: will that lambda need to be inside the VPC or can it sit outside? In most cases it can be on the outside, not needing an ENI (Elastic Network Interface). In essence, you don't need VPC to secure your lambda; refer to [AWS Lambda Best practice] for further information.
* When developing a lambda inside a VPC the main implications are the cost of using a ENI and the fact that they will be time-consuming to create. Another drawback is that garbage collection will be delayed, as VPC-enabled functions are allowed to stay idle for longer to increase the likelihood that existing ENIs are reused. Something else to think about is that there is a soft limit of 350 ENIs per region. A further drawback of vpc-enabled functions is that they suffer significantly longer cold starts. One final consideration is that using ENIs is time consuming: when a function spins up it will need to allocate and attach an ENI, and that process can take up to 10s.


<!-- Images -->
[3-tier-cognito]: ../img/3-Tier-Cognito.png#hla
[3-tier-auth0]: ../img/3-Tier-Auth0.png#hla
<!-- Links -->
[AWS Lambda Best practice]: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
[AWS SAM CLI]: https://github.com/awslabs/aws-sam-cli
[Lambda service]: https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions
[local environment variable file]: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-invoke.html
[Auth0]: https://auth0.com/learn/social-login/
[Quick Start Guide]: quick-start/
[Local Development Limitations]: developer-environment/?id=local-development-limitations
