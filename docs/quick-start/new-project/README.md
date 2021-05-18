
# Start a New Project
## Project setup
To start, create a new folder to store your project and then run `npm init` to create a new `package.json` file.

Next, install Mira, the AWS CDK and other dependencies. Edit your `package.json` file to add the following:

```json
 "dependencies": {
    "@aws-cdk/assert": "1.89.0",
    "@aws-cdk/assets": "1.89.0",
    "@aws-cdk/aws-cloudformation": "1.89.0",
    "@aws-cdk/aws-codebuild": "1.89.0",
    "@aws-cdk/aws-codecommit": "1.89.0",
    "@aws-cdk/aws-codepipeline": "1.89.0",
    "@aws-cdk/aws-codepipeline-actions": "1.89.0",
    "@aws-cdk/aws-ec2": "1.89.0",
    "@aws-cdk/aws-iam": "1.89.0",
    "@aws-cdk/aws-kms": "1.89.0",
    "@aws-cdk/aws-lambda": "1.89.0",
    "@aws-cdk/aws-lambda-event-sources": "1.89.0",
    "@aws-cdk/aws-rds": "1.89.0",
    "@aws-cdk/aws-s3": "1.89.0",
    "@aws-cdk/aws-s3-assets": "1.89.0",
    "@aws-cdk/aws-s3-deployment": "1.89.0",
    "@aws-cdk/aws-secretsmanager": "1.89.0",
    "@aws-cdk/aws-sns": "1.89.0",
    "@aws-cdk/aws-sqs": "1.89.0",
    "@aws-cdk/aws-ssm": "1.89.0",
    "@aws-cdk/core": "1.89.0",
    "@aws-cdk/custom-resources": "1.89.0",
    "aws-cdk": "1.89.0",
    "mira": "1.5.0"
}
```
Note: Use the same version of the CDK for every additional library you choose. At the time of writing, Mira 1.5.0 supports the 1.89.0 version of the CDK. 

Run `npm install`. 

Mira and the AWS CDK are now installed.

## Configure Mira
Once you have Mira installed, you can invoke it via the `npx` command. For example, to view the built-in documentation run `npx mira docs`. This presents you with a local URL that you use in your browser.

>Note: NPX is intended to be used with Mira being installed locally to >an application's node_modules directory. Mira relies on NPX to resolve >cross-platform issues. NPX will lookup node_modules/bin/mira and run that >command from your application directory.

To configure Mira you need to create a default configuration file. You need your AWS account number and chosen deployment region information to hand. Run `npx mira init` to start the configuration wizard. Enter appropriate values when prompted to replace the sample values shown below:
```
This utility will walk you through creating a default.json file.
 
Please consult the Mira documentation for definitive documentation
on these fields and exactly what they do.
 
Press ^C at any time to quit.
 
? Application Name? s3-website
? Application Prefix? nf
? CI/CD Environment AWS Account ID? 1234567890
? CI/CD Environment AWS Account Region? eu-west-1
? CI/CD Environment local AWS CLI configuration profile name? default
Successfully created config/default.json
```
This will create a Mira configuration file named `./config/default.json` containing the minimum needed to deploy an application. Refer to the [configuration section](/config/README.md) for a full description of each field.

## Build your website
This example uses a very basic `index.html` page to illustrate the deployment, but this could be the build output of a React or indeed any other application. In the root of the project, create a new folder called `web-app`. Inside, create an `index.html` file with content of your choosing, for example:

`cat web-app/index.html`
```html
<!DOCTYPE html>
<html>
    <head>
        <title>S3 Website</title>
    </head>
    <body>
        <h1>S3 Website</h1>
        <p>Welcome to my S3 powered website.</p>
    </body>
</html>
```
We can also include a custom error page for 404 and the like, for example:
`cat web-app/error.html`
```html
<!DOCTYPE html>
<html>
    <head>
        <title>S3 Website</title>
    </head>
    <body>
        <h1>ERROR</h1>
    </body>
</html>
```
## Set up TypeScript
Create a folder called `infra` with a sub-directory called `src`. This contains the code required to define and deploy your infrastructure. Mira uses TypeScript to  integrate with the AWS CDK and you need to complete a small number of steps to set that up. In the `package.json` file, include TypeScript and the type definitions for Node to the development dependencies as follows: 
```json
 "devDependencies": {
    "@types/node": "^10.17.24",
    "typescript": "^3.9.5"
  }
```
While editing `package.json`, also add the following helpful scripts which you will need later: 
```json
 "scripts": {
    "build": "tsc -p infra/",
    "dev": "tsc -p infra/ --watch",
    "deploy": "npx mira deploy s3-website --file=infra/src/index.js",
    "undeploy": "npx mira undeploy s3-website --file=infra/src/index.js"
  },
```
Note: Replace 's3-website' in the deploy/undeploy commands above with the application name you entered in the [Configure Mira](#configure-mira) section above.

Run `npm install` when complete.

To complete the TypeScript environment setup, create a new `tsconfig.json` file inside the `infra` folder and add the following to it:
```json
{
    "compilerOptions": {
      "target":"ES2018",
      "module": "commonjs",
      "lib": ["es2016", "es2017.object", "es2017.string"],
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "moduleResolution": "node",
      "allowSyntheticDefaultImports": true,
      "resolveJsonModule": true,
      "rootDir": "."
    }
}
```
This sets up some handy defaults for the project that you can customise later if you wish. Now you have the minimum setup required for your development. 

## Define your infrastructure
Now that you have a website and your TypeScript environment set up, define your infrastructure and how to deploy your content from your development machine to the cloud.

Mira is based on the AWS CDK which (among other great things) gives us two key concepts to work with:
* A [Construct], which you can think of as a building block representing a service.
* A [Stack], which is a collection of one or more constructs.

When we define a cloud application, we describe it in terms of services and how they fit together. In this example the service we use is S3. To build our application, we use an S3 construct and define our own stack which describes the resources, permissions and services needed to deploy and run our application.

We wrap our infrastructure code in a stack, MiraStack, so it can be deployed. MiraStack also includes useful methods and definitions to help enforce best practice. 
Refer to the AWS documentation for more information on [Construct] and [Stack]. Let’s implement this in code to make it clearer. 

Create a new file called `index.ts` inside the `infra/src` folder. This file will contain your stack and the constructs to define and build your application.
Edit the `index.ts` file to include each entry described in detail below. 

`AutoDeleteBucket` is a helper construct that is bundled with Mira. It creates an S3 bucket that automatically deletes when the stack is deleted. This helps keep the environment clean between deploys. Import the `AutoDeleteBucket` construct as follows:
```js
import { MiraStack, AutoDeleteBucket } from 'mira'
```
Next, import `Construct` from the CDK Core. You will need this later when defining your constructor. 
```js
import { Construct } from '@aws-cdk/core'
```
To use an S3 Bucket to store your website, import the required parts from the [aws-s3-deployment] module. This is part of the [CDK construct library] to use with Mira to build your applications.
```js
import { BucketDeployment, Source as S3DeploymentSource } from '@aws-cdk/aws-s3-deployment'
```
Import the path module to build the file system path to your web-app folder later on as follows:
```js
import * as path from 'path'
```
Define a new class called S3Webhosting that extends the MiraStack. This provides all the necessary methods and parts needed to define a CDK Stack without needing to implement it from scratch. This enables you to focus on your feature development.
```js
export default class S3Webhosting extends MiraStack {
  constructor (parent: Construct) { 
```
As with any class, you need to define a constructor. You are building your own custom construct, so you can inherit from the Construct parent class. To inherit from the parent class, you need to call super, as shown below. You also provide an additional parameter that represents the name of your custom construct, for example `S3Webhosting.name` below. This is used later (along with a unique ID) in the deploy process to avoid conflicts.
```js
 super(parent, S3Webhosting.name)
```
Now, define options for your application. The example below shows a number of S3 bucket properties that set the default document and error pages as well as allow public access. Then, pass these properties to a new instance of AutoDeleteBucket. 
```js
   const bucketProps = {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html'
    }
    const siteBucket = new AutoDeleteBucket(this, 'SiteBucket', bucketProps)
```
The line below prints out the URL of the S3 bucket after you deploy the application. As we don’t know the URL in advance, this output tells Mira (and internally the CDK) to output the URL when the deployment is finished. The concept is similar to outputs in TerraForm. 
```js
    this.addOutput('WebsiteURL', siteBucket.bucketWebsiteUrl)
```
Using the path module from earlier, build the file path to your web-app folder. This reference is needed to put the contents of the folder into the S3 bucket during the deploy phase. 
```js
    const webAppPath = path.join(__dirname, '..', '..', 'web-app')
```
This final piece puts together everything we have defined so far. Use the BucketDeployment construct to deploy your siteBucket using the contents of webAppPath. The options used below are directly from the [CDK Library documentation][BucketDeployment]. 
```js
    new BucketDeployment(this, 'Deployment', {
      destinationBucket: siteBucket,
      sources: [
        S3DeploymentSource.asset(webAppPath)
      ]
    })
```
## Deploy with Mira

With your application built, you need to prepare the CDK for use. You only need to complete this step once per environment (account/region pair). You need the AWS account number and chosen deployment region information that you used earlier to [Configure Mira](#configure-mira).

Run the following command:
```bash
npx cdk bootstrap aws://1234567890/eu-west-1 --profile default
```
The following output is displayed:
```
 ⏳  Bootstrapping environment aws://1234567890/eu-west-1...
CDKToolkit: creating CloudFormation changeset...
 
 ✅  Environment aws://1234567890/eu-west-1 bootstrapped.
```
Next, run the build command to compile your TypeScript Application to JavaScript as follows:
```bash
npm run build
```
The following output is displayed:
```
s3-website@1.0.0 build /Users/nigelhanlon/Source/cdk-fun/s3-website
tsc -p infra/
```
Note: You can use the command `npm run dev` during development to compile and check your code builds correctly. This helps spot issues early in the development cycle.  

Then, finally you can deploy your application! Use the command:

>npm run deploy

A sample output is displayed below:
```
> s3-website@1.0.0 deploy /Users/nigelhanlon/Source/cdk-fun/s3-website
> npx mira deploy s3-website --file=infra/src/index.js

Deploying Stack: (via infra/src/index.js)
 
>>> Initializing CDK for App:
    infra/src/index.js
Nigel-S3Website-Service-default: deploying...
[0%] start: Publishing cff9e774ebce393cb907708bca13f0241a0f5fe9c06ccabf836e42261f09d05f:current
[20%] success: Published 
:
:
[100%] success: Published 6080249d9f795ae70ad0c836a7fd0c0359222cb80057f82ca2f1ea36f3d763b8:current
Nigel-S3Website-Service-default: creating CloudFormation changeset...
 
 ✅  Nigel-S3Website-Service-default
 
Outputs:
Nigel-S3Website-Service-default.WebsiteURL = http://nigel-s3website-service-defaul…...s3-website-eu-west-1.amazonaws.com
 
Stack ARN:
arn:aws:cloudformation:eu-west-1:1234567890:stack/Nigel-S3Website-Service-default/a7ddfe10-c55f-11ea-82af-06b9601abbc8
```

There is considerable output from the deploy command above, but the two things to note are the `Outputs` and the `Stack ARN`. The `Outputs` section includes a URL for the S3 bucket.  Any requested outputs you put in your code are evaluated during the deploy phase and their value is printed once the deployment succeeds. 

The second item of note is the `Stack ARN`(Amazon Resource Name). If you open your AWS Web Console and go to the CloudFormation section, you see that Mira has created a new stack with the same ARN value. Any subsequent deployments reference and use this ARN unless you delete or undeploy the stack. 

## Troubleshoot
Refer to the [Troubleshooting section](/working-with-mira/README.md#troubleshooting) for common issues and how to mitigate them. If you find a bug or other issue not listed in the guide, you can report it on our GitHub issue tracker.

## Clean up
Every component deployed by Mira and the CDK is tagged to allow for rollback which undeploys and cleans up resources that are no longer required. Once you are finished with the sample application, you can clean up your environment by running the `undeploy` command as shown:
>  npm run undeploy

Sample output is displayed:
``` 
> mira-sample-s3-webhosting@1.0.0 undeploy 
> npx mira undeploy s3-website --file=infra/src/index.js
 
Undeploying Stack: (via infra/src/index.js)
 
>>> Initializing CDK for App: infra/src/index.js
Are you sure you want to delete: Nigel-S3Webhosting-Service-default (y/n)? Y
 
Nigel-S3Webhosting-Service-default: destroying...
 
 ✅  Nigel-S3Webhosting-Service-default: destroyed
```

<!--- external links --->
[aws-s3-deployment]: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-deployment-readme.html
[BucketDeployment]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-s3-deployment.BucketDeployment.html
[CDK construct library]: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html
[Construct]: https://docs.aws.amazon.com/cdk/latest/guide/constructs.html
[Stack]: https://docs.aws.amazon.com/cdk/latest/guide/stacks.html