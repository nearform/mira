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
    __Note:__ `Default` account is required in the configuration. See [config documentation](../config/README.md) for more information.

6. Deploy

   ```bash
   npm run deploy
   ```
   
At this step you should have your development environment deployed and ready to use.


## Continuous Integration

__Note:__ If you decide to not use CI, you can skip this part.

The target environment name is taken from config.cicd.accounts. That name has to have corresponding configuration
object in config.accounts section. This list is dynamic, so you can add or remove target environments.
Please make sure your `permissions.js` file exists in your application and the path used below is correct.


### Permissions for CodeBuild

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

7. `npx mira cicd --envVar GH_NPM_READ_TOKEN=YOUR_TOKEN`
    
    ℹ Token used in the above command will be visible for AWS users with permissions to read code build configuration.
    Keep in mind this might be your personal token and consider creating technical user for such purpose.
     
8. Approve roles creation

9. Mirroring
   
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
