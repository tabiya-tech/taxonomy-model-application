import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {Stage} from "@pulumi/aws/apigateway";
import {setupBackendRESTApi} from "./restApi";

export const environment = pulumi.getStack();
export const domainName = `${environment}.tabiya.tech`
export const publicApiRootPath = "/api";
export const resourcesBaseUrl = `https://${domainName}${publicApiRootPath}`;
/**
 * Setup Backend Rest API
 */
const {restApi, stage} = setupBackendRESTApi(environment, {resourcesBaseUrl});

export const backendRestApi = {
  restApiArn: restApi.arn,
  domainName: getRestApiDomainName(stage),
  path: getRestApiPath(stage)
};

// this is the base URL for the backend REST API
export const backedRestApiURLBase = pulumi.interpolate`https://${backendRestApi.domainName}${backendRestApi.path}`;

// this is the public url base for accessing tabiya resources


function getRestApiDomainName(stage: Stage) {
  return pulumi.interpolate`${stage.restApi}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`;
}

function getRestApiPath(stage: Stage) {
  return pulumi.interpolate`/${stage.stageName}`;
}