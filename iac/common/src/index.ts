import {setupCDN} from "./cdn";
import * as pulumi from "@pulumi/pulumi";
import {Output} from "@pulumi/pulumi";
import {setupDNS} from "./dns";
import {setupCert} from "./cert";

export const environment = pulumi.getStack();

const  subdomain = environment
export const domainName = `${subdomain}.tabiya.tech`

/**
 *  ROUTE 53
 */
const hostedZone = setupDNS(domainName);

/**
 * Certificate
 */
const certificate = setupCert(domainName, hostedZone);


const validationOptions = pulumi.output(certificate.domainValidationOptions[0]);
export const dns = {
  subdomain: subdomain,
  domainName: domainName,
  nameServers: hostedZone.nameServers,
  certificateValidationRecord: {
    name: validationOptions.resourceRecordName,
    type: validationOptions.resourceRecordType,
    value: validationOptions.resourceRecordValue
  }
};


/**
 * Get Backend Stack
 */

const backendStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-backend/${environment}`);
const backendRestApi = backendStack.getOutput("backendRestApi").apply((t) => {
  return {
    restApiArn: t.restApiArn,
    domainName: t.domainName,
    path: t.path
  };
}) as {
  restApiArn: Output<string>,
  domainName: Output<string>,
  path: Output<string>
}

/**
 * Get Frontend Stack
 */

const frontendStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-frontend/${environment}`);
const frontendBucket = frontendStack.getOutput("frontendBucket").apply((t) => {
  return {
    arn: t.arn,
    websiteEndpoint: t.websiteEndpoint
  };
}) as Output<{ arn: string, websiteEndpoint: string }>;

/**
 *  Cloud Front
 */
export const cdn = setupCDN(frontendBucket, backendRestApi, certificate, hostedZone, domainName);
export const backendURLBase = cdn.backendURLBase;

// The resources base URL is the base URL for accessing tabiya resources
// This should be the same as the backend URL base

const resourcesBaseUrl  = backendStack.getOutput("resourcesBaseUrl");
pulumi.all([resourcesBaseUrl, backendURLBase]).apply(([resourcesBaseUrl, backendURLBase]) => {
  if (resourcesBaseUrl !== backendURLBase) {
    pulumi.log.warn(`The resourcesBaseURL:${resourcesBaseUrl} is not the same as the backendURLBase: ${backendURLBase}`);
  }
});

export const resourcesBaseURL = resourcesBaseUrl;

export const frontendURLBase = cdn.frontendURLBase;
