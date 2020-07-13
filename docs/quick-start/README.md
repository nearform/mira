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
    
    Make sure you use a supported version of the CDK (__1.49.1__) and all the required dependencies are included in your package.json file.
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
   
At this step you should have your development environment deployed and ready to use.


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
    "aws-cdk": "1.49.1",
    "@aws-cdk/aws-cloudformation": "1.49.1",
    "@aws-cdk/aws-codebuild": "1.49.1",
    "@aws-cdk/aws-codecommit": "1.49.1",
    "@aws-cdk/aws-codepipeline": "1.49.1",
    "@aws-cdk/aws-codepipeline-actions": "1.49.1",
    "@aws-cdk/aws-iam": "1.49.1",
    "@aws-cdk/aws-lambda-event-sources": "1.49.1",
    "@aws-cdk/aws-lambda": "1.49.1",
    "@aws-cdk/aws-s3-assets": "1.49.1",
    "@aws-cdk/aws-secretsmanager": "1.49.1",
    "@aws-cdk/custom-resources": "1.49.1",
    "@aws-cdk/aws-sns": "1.49.1",
    "@aws-cdk/aws-s3": "1.49.1",
    "@aws-cdk/aws-sqs": "1.49.1",
    "@aws-cdk/assets": "1.49.1",
    "@aws-cdk/aws-kms": "1.49.1",
    "@aws-cdk/aws-ec2": "1.49.1",
    "@aws-cdk/aws-rds": "1.49.1",
    "@aws-cdk/aws-ssm": "1.49.1",
    "@aws-cdk/core": "1.49.1"
}
```



## Troubleshooting

In case your application fails to deployed, make sure that your config it properly structured and your stack definition is correct.
Mira extracts the errors from the failed nested stacks to your terminal window, so it should help you to quickly find the root cause.

Typical issues includes:
* Version mismatch for the AWS CDK, between Mira and your local package.json.
* A `profile` property is not defined for all environments in the config file.
* The code you're trying to deploy was not complied with TypeScript after recent changes.



<!---- External links ---->
[docs]: https://nf-mira.netlify.com/?#/
[nvm]: https://github.com/nvm-sh/nvm
[Duplicating a repository]: https://help.github.com/en/github/creating-cloning-and-archiving-repositories/duplicating-a-repository
