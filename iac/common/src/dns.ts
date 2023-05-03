import * as aws from "@pulumi/aws";
import {Zone} from "@pulumi/aws/route53";

export function setupDNS(domainName: string): Zone {
// Create a Route 53 hosted zone for the domain
  const hostedZone = new aws.route53.Zone("hosted-zone", {
    name: domainName,
  });

  return hostedZone;
};

