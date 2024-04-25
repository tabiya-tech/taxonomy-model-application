import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const environment = pulumi.getStack();

export const baseDomainName = process.env.BASE_DOMAIN_NAME!;
const domainName = environment+"."+baseDomainName;

pulumi.log.info(`Using base domain name : ${baseDomainName}`)
if(!domainName) throw new Error("environment variable BASE_DOMAIN_NAME is required")

// Create a Route 53 hosted zone for the domain
const _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
  name: domainName,
});

export const hostedZone = {
  ..._hostedZone,
  domainName
};

export const targetDomainName = domainName;
export const frontendURL = `https://${domainName}`;
export const backendUrl = `https://${domainName}/taxonomy/api`;
export const localesUrl = `https://${domainName}/locales/api`;
export const authUrl = `https://auth.${domainName}`;
