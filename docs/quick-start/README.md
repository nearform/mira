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
              "account": "101259067028",
              "region": "eu-west-1"
            },
            "profile": "mira-dev"
          }
       }
       ```
       
6. If you are working in the team, create `config/dev.json` file and provide your own app settings e.g.:
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


### Permissions for CodeBuild

AWS CodeBuild requires access to the target environments in order to deploy the application with the CI.
To achieve it, Mira expects a dedicated service role to be deployed first.
See [CICD](../cicd/README.md) for more information about the `Deploy Role`.

__Note:__ In the below commands `Staging` and `Production` are arbitrary names that are associated with the 
environments specified in the config file. Those names can be modified.

1. `npx mira deploy --file ./infra/src/permissions.js --env Staging`

2. Approve role creation

3. `npx mira deploy --file ./infra/src/permissions.js --env Production`

4. Approve role creation

### Code mirroring and Code Pipeline setup
5. Generate if needed RSA key with 
    ```bash
       ssh-keygen -t rsa -P '' -f ~/.ssh/codecommit_rsa
   ```
6. Adjust `config/default.json` cicd section with codecommit public key.

7. `npx mira cicd`
     
8. Approve roles creation

9. Mirroring
    __Note:__ CI/CD assumes [github actions](https://github.com/features/actions) are used for code mirroring into AWS CodeCommit. See `.github` directory for more information.
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
       
10. Push your changes to your branch specified in the `config/default.json` in `branchName` property to start CI process.

At this point, created Code Pipeline should start its execution and defined target environments should get it's own application deployment.

<!---- External links ---->
[docs]: https://nf-mira.netlify.com/?#/
[nvm]: https://github.com/nvm-sh/nvm
[Duplicating a repository]: https://help.github.com/en/github/creating-cloning-and-archiving-repositories/duplicating-a-repository
