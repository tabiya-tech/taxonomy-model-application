import * as pulumi from "@pulumi/pulumi";
import { setupLocalesBucket } from "./localesBucket";

const domainName = process.env.DOMAIN_NAME!;

pulumi.log.info(`Using domain name : ${domainName}`);
if(!domainName) throw new Error("environment variable DOMAIN_NAME is required")

/**
 * Setup Locales
 * */
const _localesBucket = setupLocalesBucket(domainName);

export const localesBucket = {
  id: _localesBucket.id,
  arn: _localesBucket.arn,
  domainName: pulumi.interpolate`${_localesBucket.bucketRegionalDomainName}`,
};
