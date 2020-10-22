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

## Using domain manager

TODO add sample

<!-- Images -->
[domain-manager-architecture]: ../img/domain-manager.png