import {setupCDN} from "./cdn";
import * as pulumi from "@pulumi/pulumi";
import {Output} from "@pulumi/pulumi";
import {setupDNS} from "./dns";
import {setupCert} from "./cert";

const environment = pulumi.getStack();
const domainName = `${environment}.tabiya.tech`

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
  domainName: domainName,
  nameServers: hostedZone.nameServers, // TODO: PLAT-77 IaC/Update the name servers at the parent domain name registrar
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
export const  backendURLBase = cdn.backendURLBase;
export const  frontendURLBase = cdn.frontendURLBase;
