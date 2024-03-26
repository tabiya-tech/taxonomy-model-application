import * as pulumi from "@pulumi/pulumi";

import {setupFrontendBucket} from "./frontendBucket";


const domainName = process.env.DOMAIN_NAME!

/**
 * Setup Frontend
 */

const _frontendBucket = setupFrontendBucket(domainName);

export const frontendBucket = {
  id:  _frontendBucket.id,
  arn: _frontendBucket.arn,
  websiteUrl: pulumi.interpolate`http://${_frontendBucket.websiteEndpoint}`,
  websiteEndpoint: _frontendBucket.websiteEndpoint
};

export const frontendBucketWebsiteURLBase = pulumi.interpolate`http://${_frontendBucket.websiteEndpoint}`;
