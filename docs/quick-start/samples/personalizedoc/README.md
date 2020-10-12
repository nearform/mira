## AWS Personalize App
The Personalize sample app demonstrates the use of [AWS Personalize](https://aws.amazon.com/personalize/) to generate personalized recommendations via machine learning.

This sample app trains a model that can create a list of recommended games, given a single game as input. The model is based on both game purchase data from the [Steam store](https://store.steampowered.com) and the play activity of those games.

### Overview
This sample application adds two nested stacks to the main Mira stack: an API and a web application.

The web stack contains a React.js [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application) which provides the UI.

The API stack contains all the AWS Personalize resources needed to provide the API for the web application.

### API Stack

#### Resources
The API stack deploys the AWS resources needed to support the personalize functionality.

These are:
- [DatasetSchema](https://docs.aws.amazon.com/personalize/latest/dg/API_DatasetSchema.html)
- [DatasetGroup](https://docs.aws.amazon.com/personalize/latest/dg/API_DatasetGroup.html)
- [Dataset](https://docs.aws.amazon.com/personalize/latest/dg/API_Dataset.html)
- [DatasetImportJob](https://docs.aws.amazon.com/personalize/latest/dg/API_DatasetImportJob.html)
- [Solution](https://docs.aws.amazon.com/personalize/latest/dg/API_Solution.html)
- [SolutionVersion](https://docs.aws.amazon.com/personalize/latest/dg/API_SolutionVersion.html)
- [Campaign](https://docs.aws.amazon.com/personalize/latest/dg/API_Campaign.html)
and additionally, a Bucket to hold the activity data used to train the model.

#### CDK Custom Resources
AWS Personalize is not directly supported by Cloud Development Kit (CDK) at the time of development. Therefore, these are all implemented using [Custom Resources](https://docs.aws.amazon.com/cdk/api/latest/docs/custom-resources-readme.html#custom-resources-for-aws-apis).

Custom Resources enable you to create AWS resources using the AWS SDK of any language supported by AWS Lambda.  This means we can use the Node.js SDK for Personalize to create the necessary resources for our application.

A complete description of how Custom Resources work is beyond the scope of this document. A brief overview is:

- An AWS [Lambda](https://aws.amazon.com/lambda/) is written for each resource.  This Lambda is invoked for creation, update and deletion of the stack and can use the SDK to perform the required actions.
- A `CustomResource` is created for each Lambda, adding in the Lambda code and an [IAM](https://aws.amazon.com/iam/) policy with the correct permissions.
- During stack creation, the Lambdas are invoked with a RequestType of `Create` and call an SDK API to create a resource.
- As several of these resources are dependent on a resource being previously created and being in a ready state, they retry the creation several times until successful or the retry limit is exceeded.
- During stack deletion, the Lambdas are invoked with a RequestType of `Delete` and the same logic applies - except the resources are deleted instead of created.  In this case, the retry logic still applies, as it is not possible to delete a resource until all its dependents have been deleted.

#### SDK Deploy/Undeploy Script
It is not possible to use CDK Custom Resources to create Solution, SolutionVersion and Campaign resources, because creating these resources takes an unpredictable amount of time (~30/45min) and we can't create them in parallel; a Campaign is related to a SolutionVersion which is related to a Solution.

To overcome this, we created a deploy script that you can run after the `yarn deploy` script has ended. It checks resources on AWS and creates what is missing. If interrupted, it can start from where it was before.

An undeploy script is also provided. It removes those resources.

Use the following commands to _deploy_:

```
$ yarn deploy
$ node samples/personalize/bin/deploy.js \
  --projectName Leonardo-Mira-Developer \
  --roleArn arn:aws:iam::101259067028:role/MiraDev-AdminAccess
```

Use the following commands to _undeploy_:
```

$ node samples/personalize/bin/undeploy.js \
  --projectName Leonardo-Mira-Developer \
  --roleArn arn:aws:iam::101259067028:role/MiraDev-AdminAccess
$ yarn undeploy
```

### Web Stack
This is a React application created using [Create React App](https://create-react-app.dev/). It follows the examples of other Mira sample apps, using S3 to store and serves the files for the application, via the [BucketDeployment](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-s3-deployment.BucketDeployment.html) construct supplied by the CDK.

#### API Endpoint

The web app calls the deployed API Gateway endpoint, handled by a Lambda that calls the AWS Personalize API. Because we don't know what this endpoint will be at deployment time, we use the following solution:
- Deploy a `js/config.js` file in the Bucket. This exposes a `window.recommendationsEndpoint` variable initially with `null` value.
- The `deploy.js` custom script gets the API endpoint and overwrites the `config.js` file in the bucket with the correct variable value.
- The frontend app checks whether `window.recommendationsEndpoint` is null. If null, it generates an error, otherwise it calls the endpoint.