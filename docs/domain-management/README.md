# Domain management

Mira provides out-of-box domain management with its Domain Manager component. It automatically handles requesting certificates and creating domain names in a hosted zone based on values set in the Mira config.

To integrate the domain management in to an application stack Mira also provides two custom resource constructs:
* **CustomCertificate** is used for creating a certificate in an account that is automatically validated
* **CustomDomain** is used for setting a CNAME record in a hosted zone

## Domain manager architecture

The domain manager is built up from two main components that are deployed to different accounts:
* The **Certificate Manager** is deployed to an application account and manages ACM certificates.
* The **Route53 Manager** is deployed to the domain account and manages records in a hosted zone.

![domain-manager-architecture]

There is one special account called `domain` account. This account contains the domain name and responsible to manage records in a hosted zone for that domain. This domain account has a `CrossAccountDomainManager` role that has permission to change record sets in a hosted zone. This role can be assumed by the other accounts when enabled in the config. The Route53 Manager has also restricted access to resources and has access only to the manage Route53 resources.

The Certificate Manager that is deployed in each configured environment has access to manage ACM certificates and to assume the `CrossAccountDomainManager` role in the `domain` account to create changes in a hosted zone.

Mira also provides two custom resources: the `CustomCertificate` to request certificate (and validate it automatically) for a domain and the `CustomDomain` that adds a CNAME record to a hosted zone so the domain name resolves for example to a CloudFront distribution.

## Using domain manager

The following steps are needed to enable custom domain deployment in an application.

### 1. Set up config
A simple config for domain management looks as the following
```json
{
  "app": {
    "prefix": "nf",
    "name": "s3-webhosting"
  },
  "domain": {
    "hostedZoneId": "HOSTED-ZONE-ID",
    "accounts": [
      "default",
      "staging",
      "domain"
    ]
  },
  "dev": {
    "target": "default"
  },
  "accounts": {
    "dev": {
      "env": {
        "account": "DEV-ACCOUNT-ID",
        "region": "ACCOUNT-REGION"
      },
      "profile": "mira-dev",
      "withDomain": true,
      "webAppUrl": "s3-sample-dev.example.com"
    },
    "staging": {
      "env": {
        "account": "STAGING-ACCOUNT-ID",
        "region": "ACCOUNT-REGION"
      },
      "profile": "mira-staging",
      "withDomain": true,
      "webAppUrl": "s3-sample-staging.example.com"
    },
    "domain": {
      "env": {
        "account": "DOMAIN-ACCOUNT-ID",
        "region": "ACCOUNT-REGION"
      },
      "profile": "mira-domain"
    }
  }
}
```
> `"HOSTED-ZONE-ID"`, `"DEV-ACCOUNT-ID"`, `"STAGING-ACCOUNT-ID"`, `"ACCOUNT-REGION"` and `"DOMAIN-ACCOUNT-ID"` values are placeholder values and must be change to valid AWS account and region values.

This example configures 3 accounts: a `default` account for development, a `staging` account for staging environment and the `domain` account where the domain name and hosted zone lives.

### 2. Deploy Route53 Manager to `domain` account

After adding the config, the `Route53 manager` needs to be deployed. This can be done by running `mira domain --env=domain`

### 3. Deploy Certificate Manager to `dev` account

The next step is to deploy the `Certificate manager` to the environments. In the case of dev this can be done by running `mira domain --env=default`

### 4. Add certificate and domain resource to the application stack

When both the `Route53 manager` and `Certificate manager` have been deployed the application can use these components to manage certificates and domain names. To save time wiring up constructs in a specific way Mira provides two constructs: `CustomCertificate` and `CustomDomain`.

To request a certificate that can be used for creating a CloudFront distribution the following code needs to be added to the stack:

```js
// Get domain name from config
const webAppUrl = MiraConfig.getEnvironment().webAppUrl;

// Request a certificate
const certificate = new CustomCertificate(this, {
  domain: webAppUrl
});

// Creating a CloudFront distribution for an S3 bucket
const distribution = createCloudFrontDistribution(siteBucket, {
  certificateArn: certificate.certificateArn,
  webAppUrl
})

// Add CNAME entry to the hosted zone
new CustomDomain(this, {
  source: webAppUrl,
  target: distribution.distributionDomainName
})
```

### 5. Deploy the application

The last step is to deploy the application stack with the following command: `mira deploy --file=infra/src/index.js`

<!-- Images -->
[domain-manager-architecture]: ../img/domain-manager.png