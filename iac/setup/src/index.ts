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

let resolvedDomainName = domainName;

if(environment === "production") {
  _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
    name: baseDomainName,
    tags: {
      Environment: "production"
    }
  });
  resolvedDomainName = baseDomainName;
} else {
  _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
    name: domainName,
  });

  resolvedDomainName = domainName;
}

export const hostedZone = {
  ..._hostedZone,
  domainName: resolvedDomainName
};

export const targetDomainName = resolvedDomainName;
export const frontendURL = `https://${resolvedDomainName}`;
export const backendUrl = `https://${resolvedDomainName}/taxonomy/api`;
export const localesUrl = `https://${resolvedDomainName}/locales/api`;
export const authUrl = `https://auth.${resolvedDomainName}`;
