import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Stack name based record in Production Account
const environment = pulumi.getStack();
const tabiyaDomainName = "tabiya.tech";

const commonStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-common/${environment}`);

const subDNS = commonStack.getOutput("dns").apply((t) => {
  return {
    domainName: t.domainName as string,
    nameServers: t.nameServers as string[]
  };
});

pulumi.all([subDNS]).apply(([subDNS]) => {
  pulumi.log.info(`subDNS: ${JSON.stringify(subDNS)}`);
});

const parentHostedZone = aws.route53.getZone({ name: tabiyaDomainName, privateZone: false });
export const subdomainRecord = new aws.route53.Record(`${environment}-subdomain-record`, {
  allowOverwrite: true,
  name: subDNS.domainName,
  type: "NS",
  ttl: 300,
  records: subDNS.nameServers,
  zoneId: parentHostedZone.then(zr => zr.zoneId) // Zone ID for tabiya.tech

}, { protect: false });


