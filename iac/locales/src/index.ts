import * as pulumi from "@pulumi/pulumi";
import { setupLocalesBucket } from "./localesBucket";

const domainName = process.env.DOMAIN_NAME!;

pulumi.log.info(`Using domain name : ${domainName}`);
if(!domainName) throw new Error("environment variable DOMAIN_NAME is required")
/**
 * Setup Locales
 * */
const environment = pulumi.getStack();
const allowedOrigins = [`https://${domainName}`];// Other domains could want to access the locales e.g. compass domain

if (environment === "dev") {
  allowedOrigins.push("http://localhost:3000"); // Local web server for frontend
  allowedOrigins.push("http://localhost:6006"); // Storybook
}

const _localesBucket = setupLocalesBucket(domainName, allowedOrigins);

export const localesBucket = {
  id: _localesBucket.id,
  arn: _localesBucket.arn,
  domainName: pulumi.interpolate`${_localesBucket.bucketRegionalDomainName}`,
};
