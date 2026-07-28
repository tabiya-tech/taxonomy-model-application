import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const environment = pulumi.getStack();

const config = new pulumi.Config();
// Optional list of additional domain names to include as SANs on the certificate.
// For externally-owned domains, ACM validation records must be added by the domain owner.
const extraSANs: string[] = config.getObject<string[]>("extraSANs") ?? [];

const hostedZoneStack = new pulumi.StackReference(`tabiya-tech/taxonomy-model-application-setup/${environment}`);
const hostedZone = hostedZoneStack.getOutput("hostedZone").apply((t) => {
  return {
    zoneId: t.id as string,
    domainName: t.domainName as string,
  };
});

const us_east_1 = new aws.Provider("us-east-1", {region: "us-east-1"});

const _cert = new aws.acm.Certificate("certificate", {
  domainName: hostedZone.domainName,
  subjectAlternativeNames: [pulumi.interpolate`*.${hostedZone.domainName}`, ...extraSANs],
  tags: {
    Environment: "dev",
  },
  validationMethod: "DNS",
}, {dependsOn: [], provider: us_east_1});

// Add the validation records for domains we control to our Route53 zone.
// For extra SANs on externally-owned domains, ACM will emit additional
// domainValidationOptions entries — export them so the external owner can
// add the required CNAME records in their own DNS zone.
const validationOptions = _cert.domainValidationOptions[0];
const record = new aws.route53.Record(`cert-validation-record`, {
  name: validationOptions.resourceRecordName,
  records: [validationOptions.resourceRecordValue],
  ttl: 300,
  type: "CNAME",
  zoneId: hostedZone.zoneId,
});

const validationRecord = new aws.acm.CertificateValidation(`cert-validation`, {
  certificateArn: _cert.arn,
  validationRecordFqdns: [record.fqdn],
}, {provider: us_east_1, dependsOn: [record, _cert] });

// Validation records for extra SANs that belong to external DNS zones.
// Hand these to the domain owner so they can add the CNAME in their zone.
export const extraSANValidationRecords = _cert.domainValidationOptions.apply((opts) =>
  opts
    .filter((o) => extraSANs.includes(o.domainName))
    .map((o) => ({
      domain: o.domainName,
      recordName: o.resourceRecordName,
      recordType: o.resourceRecordType,
      recordValue: o.resourceRecordValue,
    }))
);

export const certificate = _cert;
