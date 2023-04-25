import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {Stage} from "@pulumi/aws/apigateway";
import {setupBackendRESTApi} from "./restApi";

const environment = pulumi.getStack();

/**
 * Setup Backend Rest API
 */
const {restApi, stage} = setupBackendRESTApi(environment);

export const backendRestApi = {
  restApiArn: restApi.arn,
  domainName: getRestApiDomainName(stage),
  path: getRestApiPath(stage)
};
export const backedRestApiURLBase = pulumi.interpolate `https://${backendRestApi.domainName}${backendRestApi.path}`;

function getRestApiDomainName(stage: Stage) {
  return pulumi.interpolate  `${stage.restApi}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`;
}
function getRestApiPath(stage: Stage) {
  return pulumi.interpolate  `/${stage.stageName}`;
}