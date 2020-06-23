# Config File
This section describes how to configure the configuration file `./config/default.json`.
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

__Warning:__ Once app properties are set, any change will trigger stacks replacement!

## The Accounts Section

The accounts section of the config file is an array of accounts that can be used for deploy apps, cicd and domain management. The accounts also represent environments.

 - `name`: The name of the account. It is used for resource naming. For instance, a pipeline deploy stage is named `John-SampleApp-StagingDeploy`
 - `env`
   - `account`: Account Number for this environment.
   - `region` : Region name for this environment.
 - `profile`: A profile to use when deploying this environment from a local machine.
 - `withDomain`: Set to `true` to associate a domain with the account.
 - `webAppUrl`: The web URL for your app.
 - `requireManualApproval`: When set to `true` in a pipeline, the previous step of this deploy should be a manual `Promote` stage.

## The CI/CD Section

The CI/CD section of the config file configures the pipeline. It contains the following settings:
 - `account`: The account where the pipeline is deployed.
 - `buildspecFile`: Local reference to the `buildspec.yaml` file that is used by AWS CodeBuild.
 - `provider`: The code provider to use to get the code. It can be either `github` or `codecommit`.
 - `repositoryUrl`: The repository URL for this project.
 - `branchName`: The branch to checkout during CI/CD.
 - `gitHubTokenSecretArn`: If you use `github` as the provider, put your Personal Access Token in a SecretsManager and provide the Amazon Resource Name (ARN).
 - `codeCommitUserPublicKey`: If you use `codecommit` as the provider, provide the public key to pull code in CodeBuild.
 - `accounts`: An array of strings. Each string must be `accounts[].name` value. It represents which account is enabled for the CI/CD Pipeline. Order is preserved.
    __Caution:__ Make sure to not include any whitespace characters in `codeCommitUserPublicKey`
## The Domain Section

The domain section of the config file contains the following:
 - `hostedZoneId`: ID of the Route53 hosted zone to change DNS records.
 - `accounts`: An array of strings. Each string must be `accounts[].name` value. The Certificate Manager and the Route53 Manager are deployed in the account.

# A Sample Config File

Let's take a look at a sample config file.
```
{
  "app": {
    "prefix": "John",
    "name": "My Great App"
  },
  "baseDomain": "mira-example.com",
  "domain": {
    "hostedZoneId": "Z1234567890",
    "accounts": [
      "Domain"
    ]
  },
  "cicd": {
    "account": "1111111111111",
    "buildspecFile": "infra/buildspec.yaml",
    "provider": "codecommit",
    "profile": "mira-dev",
    "repositoryUrl": "https://github.com/leorossi/mira-sample-s3-webhosting",
    "branchName": "feature/feature-xyz",
    "codeCommitUserPublicKey": "ssh-rsa ...",
    "environmentVariables": [
      {
        "name": "CUSTOM_VARIABLE",
        "value": "123453546647"
      }
    ],
    "accounts": [ "Staging", "Production" ]
  },
  "accounts": [
    {
      "name": "Staging",
      "env": {
        "account": "2222222222222",
        "region": "eu-west-1"
      },
      "profile": "mira-dev",
      "withDomain": true,
      "webAppUrl": "staging.mira-nf.com",
      "requireManualApproval": false
    },
    {
      "name": "Default",
      "env": {
        "account": "333333333333",
        "region": "eu-west-1"
      },
      "profile": "my-user",
      "withDomain": true,
      "webAppUrl": "user.mira-nf.com"
    },
    {
      "name": "Production",
      "env": {
        "account": "4444444444444",
        "region": "eu-west-1"
      },
      "profile": "mira-prod",
      "withDomain": true,
      "webAppUrl": "prod.mira-nf.com",
      "requireManualApproval": true
    },
    {
      "name": "Domain",
      "env": {
        "account": "5555555555555",
        "region": "eu-west-1"
      },
      "profile": "mira-prod",
      "withDomain": true,
      "webAppUrl": "domain.mira-nf.com",
      "requireManualApproval": true
    }
  ]

}
```
## Accounts
We define four accounts in the sample config file above: `Staging`, `Production`, `Default`, `Domain`, each with different account numbers.
They all work on `eu-west-1` region, even though this is not a requirement.

The `Default` account may represent a developer personal account where they can test all Mira deployments. It uses the profile `my-user` defined in the `~/.aws` directory.

## CI/CD
`Staging` and `Production` accounts are defined in the `cicd.accounts` value. The CodePipeline then has `StagingDeploy` and `ProductionDeploy` stages which deploy your app into the accounts `2222222222222` and `4444444444444` respectively.

AWS CodeBuild runs using the `infra/buildspec.yaml` file, where the directory is relative to the project's root path.

The pipeline runs on the branch `feature/feature-xyz`.


## Domain

Domain management components (Certificate, Route53 and so on) are deployed on the `Domain` account. It uses `Z1234567890` as the Hosted Zone ID.

NB Example domain usage to follow in upcoming releases.
