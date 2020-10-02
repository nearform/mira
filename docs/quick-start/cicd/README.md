# Continuous Integration

See [Continuous Integration documentation](../cicd/README.md) for more detail on the CI/CD pipeline.

See [Configuration documentation](../config/README.md) for more information about properties.


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

## Code mirroring and Code Pipeline setup

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

At this point, the created Code Pipeline should start its execution and the defined target environments should get their own application deployment.
