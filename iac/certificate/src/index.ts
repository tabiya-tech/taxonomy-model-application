import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const environment = pulumi.getStack();

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
  subjectAlternativeNames: [pulumi.interpolate`*.${hostedZone.domainName}`],
  tags: {
    Environment: "dev",
  },
  validationMethod: "DNS",
}, {dependsOn: [], provider: us_east_1});

// Add the validation records to the DNS zone
// There is one validation record since  the validation method is DNS
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

export const certificate = _cert;
