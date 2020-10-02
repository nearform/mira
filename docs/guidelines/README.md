# Guidelines

## General Considerations

* Mira is published as an NPM package. To use Mira, it must be added as a dependency to your own project.
* Keep your infrastructure definition and your business logic in separate node modules. Otherwise, when you upload your code into the cloud, the CDK dependencies are also uploaded.

## Sample Application Considerations

Consider the following if you wish to modify the sample applications provided with Mira:

* The CI pipeline depends on the deployment permissions in the file `mira/cicd/deployment-permissions/index.ts`. These permissions are tailor-made for the existing sample applications.
If you modify a sample application, you may need to update this file to reflect your new infrastructure.
* Each sample application has a `buildspec.yaml` file. You may need to adjust the build process to meet your needs.

## Lambdas and VPCs

* When developing a new Lambda, a decision needs to be made: will that lambda need to be inside the VPC or can it sit outside? In most cases it can be on the outside, not needing an ENI (Elastic Network Interface). In essence, you don't need VPC to secure your lambda; refer to [AWS Lambda Best practice] for further information.
* When developing a lambda inside a VPC the main implications are the cost of using a ENI and the fact that they will be time-consuming to create. Another drawback is that garbage collection will be delayed, as VPC-enabled functions are allowed to stay idle for longer to increase the likelihood that existing ENIs are reused. Something else to think about is that there is a soft limit of 350 ENIs per region. A further drawback of vpc-enabled functions is that they suffer significantly longer cold starts. One final consideration is that using ENIs is time consuming: when a function spins up it will need to allocate and attach an ENI, and that process can take up to 10s.

<!-- Links -->
[AWS Lambda Best practice]: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
