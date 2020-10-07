# Naming

One of the important problems Mira solves is the naming of resources.  If you
wanted to organize an application ecosystem within an AWS account you might
need to solve a few problems:

* distinguish between resources by environment
* scope resource names per application
* lookup names by resource type within your account

Mira solves this with the following naming format:

![overview]

Mira then provides a lookup mechanism that can be used at build-time or at
run-time to discover resources as listed by resource type.

This section goes into each part of the name in detail.

## Env

Mira handles each environment with a separte config file.  See the [config](/config/)
section for more information.  The config that is used is determined by the
environment.  The environment name winds up being used within the resource
names deployed by Mira:

![env]

Mira provides flexibility to developers in how information is passed into the
executable.  In the above diagram, a user may pass in the environment either
through the `NODE_ENV` environment variable or via a CLI argument.

## Prefix

The prefix is an optional naming part that a developer may specify in their
[config](/config/) file (as determined by environment).  If no prefix is provided,
then this part of the resource name is omitted (including hyphens):

![prefix]

A prefix can be helpful when trying to distinguish multiple apps as belonging
to a group, e.g. a part of an organization, an initiative, etc.


## App Name

The app name is a semantic identifier for the application a developer is
constructing.  It is intended to persist across stack names, all of which
contain resources to construct the "app":

![appname]

Note that an application name should be provided.  If no application name is
provided, then Mira will use the default name provided by `config/default.json`
and inform the user that they should configure this setting.

## Stack Name

Although every stack will technically consist of the `<env>-<prefix>-<appName>-<stackName>`
naming pattern, the `<stackName>` part identifies the specific stack that Mira
is constructing:

![stackname]

The stack name may be provided one of three ways.  First, the mainfile provided
to the Mira executable, e.g. `mira deploy someFile.js` can specify an 
`export stackName = 'someStackName'`.  Second, since every deployment should
consist of at least one stack, the stack name can be provided inline with the
deploy command: `mira deploy someStackName someFile.js`.

Note: A stack name must be provided for each deployment.

## Resource Name

Mira provides interfaces for constructing resources.  All resources constructed
within a `MiraObject` class instance will automatically perform naming and store
created resources in the Mira resource directory.  Otherwise, CDK may be used
out-of-the-box and call `MiraNames.getName(resourceType: string, resouceName: string): string`.

![resourcename]

<!-- Images -->
[overview]: ../img/naming/overview.png
[env]: ../img/naming/env.png
[prefix]: ../img/naming/prefix.png
[appname]: ../img/naming/appname.png
[stackname]: ../img/naming/stackname.png
[resourcename]: ../img/naming/resourcename.png
