import {setupCDN} from "./cdn";
import * as pulumi from "@pulumi/pulumi";
import {Output} from "@pulumi/pulumi";
import { acm } from "@pulumi/aws/types/input";

export const environment = pulumi.getStack();

const baseDomainName = process.env.BASE_DOMAIN_NAME!;

pulumi.log.info(`Using base domain name : ${baseDomainName}`);
if(!baseDomainName) throw new Error("environment variable BASE_DOMAIN_NAME is required")

const  subdomain = environment
export const domainName = `${subdomain}.${baseDomainName}`;

const setUpStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-setup/${environment}`);
const hostedZone = setUpStack.getOutput("hostedZone").apply((t) => ({
  zoneId: t.zoneId,
  nameServers: t.nameServers
} as Output<{ zoneId: string, nameServers: string[] }>))

const certificateStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-certificate/${environment}`);
const certificate = certificateStack.getOutput("certificate").apply((t) => ({
  domainValidationOptions: t.domainValidationOptions,
  arn: t.arn
} as Output<{ domainValidationOptions: acm.CertificateDomainValidationOption[], arn: string }>))

/**
 * Certificate
 */

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
const swaggerBucket = backendStack.getOutput("swaggerBucket").apply((t) => {
  return {
    arn: t.arn,
    websiteEndpoint: t.websiteEndpoint
  };
}) as Output<{ arn: string, websiteEndpoint: string }>;
const redocBucket = backendStack.getOutput("redocBucket").apply((t) => {
  return {
    arn: t.arn,
    websiteEndpoint: t.websiteEndpoint
  };
}) as Output<{ arn: string, websiteEndpoint: string }>;

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
 * Locales Stack
 */
const localesStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-locales/${environment}`);
const localesBucket = localesStack.getOutput("localesBucket").apply((t) => {
  return {
    arn: t.arn,
    websiteEndpoint: t.domainName
  };
}) as Output<{ arn: string, websiteEndpoint: string }>;

/**
 *  Cloud Front
 */
export const cdn = setupCDN({
  frontendBucketOrigin: frontendBucket,
  backendRestApiOrigin: backendRestApi,
  swaggerBucketOrigin: swaggerBucket,
  redocBucketOrigin: redocBucket,
  localesBucketOrigin: localesBucket
}, certificate.arn, hostedZone.zoneId, domainName);
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
