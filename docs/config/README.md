# Config File
This section describes how to configure the configuration file `./config/default.json`.
Mira's configuration system is based on the [node config](https://www.npmjs.com/package/config) library.

## Location

In your app, the config file must be located in `./config/default.json`

## Main Section

```
"app": {
  "prefix": "John"
  "name" : "Sample App"
}
```

This data is used to generate Cloud Development Kit (CDK) Resource names.

The example above generates `John-SampleApp` as the prefix for stacks, roles, pipelines stages and so on.

__Warning:__ Once app properties are set, any change will trigger a replacement of the stacks!

# A Sample Config File

Let's take a look at a sample config file.
```
{
  "app": {
    "prefix": "John",
    "name": "My Great App"
  },
  "dev": {
    "target": "staging"
  },
  "cicd": {
    target: "cicd",
    "buildspecFile": "infra/buildspec.yaml",
    "provider": "codecommit",
    "profile": "mira-dev",
    "repositoryUrl": "YORU_REPO_URL",
    "branchName": "feature/feature-xyz",
    "codeCommitUserPublicKey": "ssh-rsa ...",
    "environmentVariables": [
      {
        "name": "CUSTOM_VARIABLE",
        "value": "123453546647"
      }
    ],
    "stages": [
      {
        "target": "staging",
        "withDomain": false,
        "requireManualApproval": false
      },
      {
        "target": "production",
        "withDomain": false,
        "requireManualApproval": true
      }
    ]
  },
  "accounts": {
      "cicd": {
        "env": {
          "account": "ACCOUNT_NUMER",
          "region": "REGION"
        },
        "profile": "mira-dev"
      },
      "staging": {
        "env": {
          "account": "ACCOUNT_NUMER",
          "region": "REGION"
        },
        "profile": "mira-dev"
      },
      "production": {
        "env": {
          "account": "ACCOUNT_NUMER",
          "region": "REGION"
        },
        "profile": "mira-prod"
      }
    }
}
```

## Accounts
The accounts section of the config file is an array of account objects that can be used to deploy apps and run cicd. The accounts also represent environments.
We define three accounts in the sample config file above: `staging`, `production`, `cicd`, each with different account numbers.

The `staging` account may represent a developer personal account where they can test all Mira deployments. It uses the default profile defined in the `~/.aws` directory or the one passed as `--profile` parameter in the CLI command.


## CI/CD
`cicd` section specifies stages of the deployment pipeline and other properties required for CI pipeline to work.
* `target` - Name of the account where CI pipeline will be deployed.
* `buildspecFile` - Path to the buildspec file used by AWS CodeBuld for application deployment.
* `repositoryUrl` - Repository URL that is decomposed to extract project name used in the pipeline.
* `branchName` - Name of the branch used by the pipeline.
* `codeCommitUserPublicKey` - RSA public key used for the Mira service user to get permissions to mirror the repository.
    __Caution:__ Make sure to not include any whitespace characters in `codeCommitUserPublicKey`
* `environmentVariables` - An array of environment variables passed into AWS CodeBuild.
    e.g.:
    ```json
      {
        "name": "FOO",
        "value": "BAR"
      }
    ```
* `stages` - the ordered list of stages where Code Pipeline will deploy the application.
Stage is described by 3 properties:
    * `target` - name of the account used as a target account for the application deployment.
    * `withDomain` - boolean that specifies if application supports custom domain __NB domain usage to follow in upcoming releases.__.
    * `requireManualApproval` - boolean that specifies if manual approval is needed in the pipeline before continuing deployment.

## Domain

Domain management components (Certificate, Route53 and so on) are deployed on the `Domain` account. It uses `Z1234567890` as the Hosted Zone ID.

NB Example domain usage to follow in upcoming releases.

## Developer config

To enable custom config modifications for developers working in the same team, Mira expects a `config/dev.json` file to be created.

__Note:__ This file should not by tracked in GIT.

Whenever a `config/dev.json` file is created and available at runtime, the contents of the `config/default.json` will be overridden in a shallow way. It means only the top-level properties are merged. The method used is comparable to [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).

