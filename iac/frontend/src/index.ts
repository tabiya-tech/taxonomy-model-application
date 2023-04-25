import * as pulumi from "@pulumi/pulumi";

import {setupFrontendBucket} from "./frontendBucket";


const environment = pulumi.getStack();
const domainName = `${environment}.tabiya.tech`

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