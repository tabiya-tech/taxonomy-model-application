import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Zone } from "@pulumi/aws/route53/zone";

export const environment = pulumi.getStack();

const PLATFORM = "platform";

const _baseDomainName = process.env.BASE_DOMAIN_NAME!;

export const baseDomainName = PLATFORM + "." + _baseDomainName;

const domainName = environment + "." + PLATFORM + "." + _baseDomainName;

pulumi.log.info(`Using base domain name : ${_baseDomainName}`);
if (!_baseDomainName)
  throw new Error("environment variable BASE_DOMAIN_NAME is required");

// Create a Route 53 hosted zone for the domain
let _hostedZone: Zone;

let theDomainName = domainName;

if(environment === "production") {
  _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
    name: baseDomainName,
    tags: {
      Environment: "production"
    }
  });
  theDomainName = baseDomainName;
} else {
  _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
    name: domainName,
  });

  theDomainName = domainName;
}

export const hostedZone = {
  ..._hostedZone,
  domainName: theDomainName
};

export const targetDomainName = theDomainName;
export const frontendURL = `https://${theDomainName}`;
export const backendUrl = `https://${theDomainName}/taxonomy/api`;
export const localesUrl = `https://${theDomainName}/locales/api`;
export const authUrl = `https://auth.${theDomainName}`;
