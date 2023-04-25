import * as aws from "@pulumi/aws";
import {Zone} from "@pulumi/aws/route53";

export function setupCert(domainName: string, dns: Zone): aws.acm.Certificate {
  // Issue a certificate.
  // According to aws it must be us-east-1 region see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html

  const us_east_1 = new aws.Provider("us-east-1", {region: "us-east-1"});

  const cert = new aws.acm.Certificate("cert", {
    domainName: domainName,
    tags: {
      Environment: "dev",
    },
    validationMethod: "DNS",
  }, {dependsOn: [dns], provider: us_east_1});
  // Add the validation records to the DNS zone
  // There is one validation record since  the validation method is DNS
  const validationOptions = cert.domainValidationOptions[0];
  const record = new aws.route53.Record(`cert-validation`, {
    name: validationOptions.resourceRecordName,
    records: [validationOptions.resourceRecordValue],
    ttl: 300,
    type: "CNAME",
    zoneId: dns.zoneId,
  });

  const validationRecord = new aws.acm.CertificateValidation(`cert-validation`, {
    certificateArn: cert.arn,
    validationRecordFqdns: [record.fqdn],
  }, {provider: us_east_1});
  return cert;
}
