import * as aws from "@pulumi/aws";
import {Zone} from "@pulumi/aws/route53";

export function setupDNS(domainName: string): Zone {
// Create a Route 53 hosted zone for the domain
  const hostedZone = new aws.route53.Zone("hosted-zone", {
    name: domainName,
  });
  new aws.route53.Record("auth-cname-record", {
    name: "auth",
    type: "CNAME",
    zoneId: hostedZone.zoneId,
    records: ["d2adpmhk9okuod.cloudfront.net"],
    ttl: 300, // Adjust TTL as needed
  });
  return hostedZone;
}

