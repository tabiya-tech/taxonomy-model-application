import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Stack name based record in Production Account
const environment = pulumi.getStack();

const commonStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-setup/${environment}`);

const subDNS = commonStack.getOutput("hostedZone").apply((t) => {
  return {
    domainName: t.domainName as string,
    nameServers: t.nameServers as string[]
  };
});

const parentDomainName = commonStack.getOutput("baseDomainName").apply(t => t as string);

pulumi.all([subDNS, parentDomainName]).apply(([subDNS, parentDomainName]) => {
  pulumi.log.info(`subDNS: ${JSON.stringify(subDNS)}`);
  pulumi.log.info(`Using parent domain name: ${parentDomainName}`);
});

const parentHostedZone = parentDomainName.apply(name => aws.route53.getZone({ name, privateZone: false }));

export const subdomainRecord = new aws.route53.Record(`${environment}-subdomain-record`, {
  allowOverwrite: true,
  name: subDNS.domainName,
  type: "NS",
  ttl: 300,
  records: subDNS.nameServers,
  zoneId: parentHostedZone.zoneId,

}, { protect: false });
