import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const environment = pulumi.getStack();

export const baseDomainName = "platform." + process.env.BASE_DOMAIN_NAME!;

// for production environment we dont append environment
const domainName = environment === "production" ?
  baseDomainName :
  environment + "." + baseDomainName;

pulumi.log.info(`Using base domain name : ${baseDomainName}`);
if (!baseDomainName)
  throw new Error("environment variable BASE_DOMAIN_NAME is required");

// Create a Route 53 hosted zone for the domain
let _hostedZone = new aws.route53.Zone("base-domain-hosted-zone", {
  name: domainName,
  tags: {
    Environment: "production"
  }
});

export const hostedZone = {
  ..._hostedZone,
  domainName: domainName
};

export const targetDomainName = domainName;
export const frontendURL = `https://${domainName}`;
export const backendUrl = `https://${domainName}/taxonomy/api`;
export const localesUrl = `https://${domainName}/locales/api`;
export const authUrl = `https://auth.${domainName}`;
