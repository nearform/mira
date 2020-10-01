# Get Started

Mira is published as an NPM package. To use Mira, it must be added as a dependency to your own project. To get started, choose one of the following sample apps and generate your own project repository:

- [mira-sample-s3-webhosting](https://github.com/nearform/mira-sample-s3-webhosting/generate)

NB Just one sample app available at this time

⚠️ Remember to make your new repository __🕵🏻‍♀️ Private__ as you store potentially sensitive information in the Mira configuration files.

## Clone and Initialise

Clone your newly created repository and follow the instructions below.

1. Ensure that you are using Node.js v12:
 
   ```bash
   % node --version
   v12.16.3
   ```

   or, if using [nvm]:

   ```bash
   % nvm use
   Now using node v12.16.3 (npm v6.14.4)
   ```

2. Install the required dependencies, as instructed by the specific sample you cloned.
    
    Make sure you use a supported version of the CDK (__1.61.1__) and all the required dependencies are included in your package.json file.
    For the full list go to [Mira Dependencies](#mira-dependencies)

   ℹ️ You may have to use `yarn` instead of `npm`. Check your sample project readme for instructions.

3. Build

   ```bash
   npm run build
   ```

4. Set up your config file

   ```bash
   cp config/default.sample.json config/default.json
   # edit this new default.json file e.g. update the prefix
   ```
   
5. Adjust `config/default.json` with your settings

    1. Update app and dev sections with your desired values e.g.:
        ```bash
        "app": {
           "prefix": "big-company",
           "name": "super-app"
         },
        "dev": {
            "target": "default"
        }
       ```
    2. Update `accounts` section to include at least settings for your `default` (name specified as a target in `dev` section) deployment e.g.:
        ```bash
        "accounts": {
          "default": {
            "env": {
              "account": "11111111111",
              "region": "eu-west-1"
            },
            "profile": "mira-dev"
          }
       }
       ```
       
6. If you are working as part of a team, create a `config/dev.json` file and provide your own app settings e.g.:
    ```bash
    "app": {
       "prefix": "john",
       "name": "super-app"
     }
   ```
   __Note:__ `config/dev.json` file is specific to your personal setup and should not be tracked in GIT.

7. Bootstrap AWS CDK on target AWS account and region, e.g.:
    ```bash
   cdk bootstrap aws://YOUR_NUMBER/YOUR_REGION --profile YOUR_PROFILE
   ```
   __Note:__ If CDK is already bootstrapped, you can skip this step.
   
8. Deploy

   ```bash
   npm run deploy
   ```
   __Note:__ The default tags will be associated to that stack: StackName,  CreatedBy (Owner) and CostCenter (If defined).
At this step you should have your development environment deployed and ready to use.

### Experimental Feature: Deploying S3 Bucket Content Only

Sometimes you want to only deploy changes made to S3 content, such as with frontends you wish to deploy.  It can be cumbersome to go through a stack changeset as this can take minutes.  You can use the `--s3-only` flag to attempt to deploy any assets that CDK would otherwise push up to S3 buckets.  This can shrink deployment times down to 15-30 seconds and allows you to share S3-connected assets easily.  To do this, you might run a command like:

`npx mira deploy myStackName --file=path/to/stackFile.js --s3-only`

Note, that this command will only work if you have already deployed this stack once before!  If it is successful, you should see the console log the HTTP-accessible location of your files:

![quick-deploy]

## Developing with Mira locally

You may want to author changes to the Mira package and immediately use those
changes in your Mira application.  You can do this using the following syntax
from your local Mira directory:

```
node scripts/link.js [APPLICATION_PATH]
```

For instance, if your application is at `../app` you'd run the script:

```
node scripts/link.js ../app
```

If you have an existing installation or Mira dependency installed in `../app` 
then Mira will copy it to `../app/mira.old`.  To reinstall a remote version of
Mira from GitHub or NPM just delete your `node_modules` folder and re-run 
`npm install` in your application directory.

## 

### Implementation Details

The reason Mira uses the `link` script found under `scripts/link.js` is because
of complications arising from AWS CDK requiring itself to be listed as a
peer dependency.  Utilizing the `--preserve-symlinks` flag alongside `npm link`
usage is not enough: Mira will still read `app/node_modules/mira/node_modules/aws-cdk`.

As a result of this, Mira implements the `link` script which will symlink in the
necessary files and dependencies to run Mira without symlinking the AWS CDK
dependencies intended to be used as peer dependencies.

## Continuous Integration

__Note:__ If you decide to not use CI, you can skip this part.

See [config documentation](../config/README.md) for more information about properties.


1. Make sure to adjust your `default.json` file with proper values in the `cicd.env` section.
    __Note:__ If you're not using github and/or you don't want to use github actions for 
    the code mirroring, you can remove the `codeCommitUserPublicKey` attribute.
    
    __Note:__ `codeCommitUserPublicKey` source will be defined in the next steps. 

    E.g.:
    
    ```bash
    "cicd": {
        "target": "cicd",
        "buildspecFile": "infra/buildspec.yaml",
        "permissionsFile": "infra/src/permissions.js",
        "provider": "codecommit",
        "repositoryUrl": "YOUR_REPOSITORY_URL",
        "branchName": "master",
        "codeCommitUserPublicKey": "ssh-rsa YOUR_PUBLIC_KEY",
        "stages": [
          {
            "target": "staging",
            "withDomain": false,
            "requireManualApproval": false
          }
        ]
      }
    ```
    
2. Modify `accounts` section and modify respective target account configuration.
Every target specified in the `cicd.stages`, must be specified in the `accounts` section.
    E.g.:
    ```bash
    "accounts": [{
      "name": "default",
      "env": {
        "account": "YOUR_NUMBER",
        "region": "YOUR_REGION"
      },
      "profile": "YOUR_PROFILE_NAME"
    },
    "staging": {
      "env": {
        "account": "YOUR_NUMBER",
        "region": "YOUR_REGION"
      },
      "profile": "YOUR_PROFILE_NAME"
    }]
   ```

This list is dynamic, so you can add or remove target environments.

### Code mirroring and Code Pipeline setup
3. Generate if needed RSA key with 
    ```bash
       ssh-keygen -t rsa -P '' -f ~/.ssh/codecommit_rsa
   ```
4. Adjust `config/default.json` cicd section with codecommit public key.

5. `npx mira cicd`
     
6. Approve roles creation

7. Mirroring
    __Note:__ CI/CD assumes [github actions](https://github.com/features/actions) are used for code mirroring into AWS CodeCommit. See the `.github` directory for more information.
    Otherwise, the developer is responsible for mirroring the code into the dedicated AWS CodeCommit or use AWS CodeCommit directly.
   
    1. Create a secret with the name `iamusercodecommit`.
    
       Use the value taken from the `codecommit_rsa` file. This file contains text which looks like:
    
       ```
       -----BEGIN OPENSSH PRIVATE KEY-----
       b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAA[...]
       -----END OPENSSH PRIVATE KEY-----
       ```
    
    2. Create a secret with the name `iamusername`.
    
       Set `iamusername` to the value listed in the CI/CD stack output. You get this when you deploy the CI/CD Stack. If you have not yet completed the steps described in [Deploy the CI/CD Stack](#deploy-the-cicd-stack), __you have to pause and return here with the value__ when you have deployed the CI/CD stack.
    
       If you returned here to update this value, get it from the `GitUserName` output listed in the CI/CD CloudFormation stack that was created.
    
        __Note:__ Each time the CI pipeline is recreated, you must also update the `iamusername` with the new value.
    
    3. Create a secret with the name `targetrepository`.
    
       Set the value of `targetrepository` to the SSH clone URL of the CodeCommit repository which was created for the CI/CD stack. Get this value from the AWS CodeCommit dashboard by clicking the SSH clone link next to the
       repository.
       
8. Push your changes to your branch specified in the `config/default.json` in `branchName` property to start CI process.

At this point, created Code Pipeline should start its execution and defined target environments should get it's own application deployment.


## Mira Dependencies

Keep in mind, AWS CDK requires all the modules to be the same version.
```json
{
    "aws-cdk": "1.61.1",
    "@aws-cdk/aws-cloudformation": "1.61.1",
    "@aws-cdk/aws-codebuild": "1.61.1",
    "@aws-cdk/aws-codecommit": "1.61.1",
    "@aws-cdk/aws-codepipeline": "1.61.1",
    "@aws-cdk/aws-codepipeline-actions": "1.61.1",
    "@aws-cdk/aws-iam": "1.61.1",
    "@aws-cdk/aws-lambda-event-sources": "1.61.1",
    "@aws-cdk/aws-lambda": "1.61.1",
    "@aws-cdk/aws-s3-assets": "1.61.1",
    "@aws-cdk/aws-secretsmanager": "1.61.1",
    "@aws-cdk/custom-resources": "1.61.1",
    "@aws-cdk/aws-sns": "1.61.1",
    "@aws-cdk/aws-s3": "1.61.1",
    "@aws-cdk/aws-sqs": "1.61.1",
    "@aws-cdk/assets": "1.61.1",
    "@aws-cdk/aws-kms": "1.61.1",
    "@aws-cdk/aws-ec2": "1.61.1",
    "@aws-cdk/aws-rds": "1.61.1",
    "@aws-cdk/aws-ssm": "1.61.1",
    "@aws-cdk/core": "1.61.1"
}
```



## Troubleshooting

In case your application fails to deployed, make sure that your config it properly structured and your stack definition is correct.
Mira extracts the errors from the failed nested stacks to your terminal window, so it should help you to quickly find the root cause.

Typical issues includes:

* Version mismatch for the AWS CDK, between Mira and your local package.json.
* A `profile` property is not defined for all environments in the config file.
* The code you're trying to deploy was not complied with TypeScript after recent changes.

### CDK Version Mismatch

A version mismatch usually presents itself as a TypeScript Error when attempting to run a build. Below is an example error from the S3 web hosting sample:

```sh
➜ npm run build

> s3-website@1.0.0 build /Users/nigelhanlon/Source/cdk-fun/s3-website
> tsc -p infra/

infra/src/index.ts:37:26 - error TS2345: Argument of type 'this' is not assignable to parameter of type 'Construct'.
  Type 'S3Website' is not assignable to type 'Construct'.
    Property 'onValidate' is protected but type 'Construct' is not a class derived from 'Construct'.

37     new BucketDeployment(this, 'Deployment', {
                            ~~~~


Found 1 error.

```

To resolve this, make sure each cdk related item and the cdk package itself all match the version number supported by Mira in your package.json file.

### Configuration Issues

If there is a problem with the configuration file, or the file itself is missing, you will be presented with an error similar to this:

```sh
WARNING: No configurations found in configuration directory:/Users/nigelhanlon/Source/cdk-fun/s3-website/config

Configuration property "app.name" is not defined, you will not be able to deploy your app yet.

/usr/local/lib/node_modules/mira/node_modules/config/lib/config.js:182
    throw new Error('Configuration property "' + property + '" is not defined');
          ^
Error: Configuration property "app.name" is not defined
    at Config.get (/usr/local/lib/node_modules/mira/node_modules/config/lib/config.js:182:11)
    at new MiraConfigClass (/usr/local/lib/node_modules/mira/src/config/mira-config.ts:72:50)
    at Object.<anonymous> (/usr/local/lib/node_modules/mira/src/config/mira-config.ts:209:27)
    at Module._compile (internal/modules/cjs/loader.js:688:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:699:10)
    at Module.load (internal/modules/cjs/loader.js:598:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:537:12)
    at Function.Module._load (internal/modules/cjs/loader.js:529:3)
    at Module.require (internal/modules/cjs/loader.js:636:17)
    at require (internal/modules/cjs/helpers.js:20:18)

```

You can resolve this by running `npx mira init` or checking your configuration file matches the expected fields. 

### CDK Deployment Issues

On rare occasions you may need to recreate the CDK bootstrap environment. This environment is created when you run `cdk bootstrap` and sets up a workspace where temporary assets and configurations can be stored during deployment. This workspace can sometimes become corrupted and cause strange or unexplained failures such as permission issues. For example, on the S3 Sample application, it can manifest as a permission issue when attempting to copy files to the destination S3 bucket even though the deployment user may have administrator privilege.

If you have exhausted other possible causes and issues for a deployment failure, you can delete the CDK Toolkit and recreate it using the following steps:

- Login to the AWS Web Console
- (Optional) Switch Roles to match your deployment account
- Go to CloudFormation Tool
- Locate the `CDKToolkit` stack and highlight it
- Click `Delete` from the top menu bar and confirm.
- Once deleted you can bootstrap the CDK again as documented above.

*Please note* that if you delete the CDK Toolkit environment, you will not be able to deploy any new or existing Mira applications until it has been recreated. This also includes any configured CI/CD pipelines.


<!---- External links ---->
[docs]: https://nf-mira.netlify.com/?#/
[nvm]: https://github.com/nvm-sh/nvm
[Duplicating a repository]: https://help.github.com/en/github/creating-cloning-and-archiving-repositories/duplicating-a-repository

<!-- Images -->
[quick-deploy]: img/quick-deploy.png
