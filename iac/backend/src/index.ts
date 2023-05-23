import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {getRestApiDomainName, getRestApiPath, setupBackendRESTApi} from "./restApi";
import {setupUploadBucket, setupUploadBucketPolicy} from "./uploadBucket";
import {setupAsyncImportApi} from "./asyncImport";

export const environment = pulumi.getStack();
export const domainName = `${environment}.tabiya.tech`
export const publicApiRootPath = "/api";
export const resourcesBaseUrl = `https://${domainName}${publicApiRootPath}`;

export const currentRegion = pulumi.output(aws.getRegion()).name;



/**
 * Setup Upload Bucket
 */
const allowedOrigins = [`https://${domainName}`, (environment === "dev") ? "http://localhost:3000" : undefined].filter(Boolean) as string[];
const uploadBucket = setupUploadBucket(allowedOrigins);
export const uploadBucketName = uploadBucket.id;


/**
 * Setup Async Import
 */

const {asyncLambdaRole, asyncLambdaFunction} = setupAsyncImportApi(environment, {
  mongodb_uri: process.env.MONGODB_URI ?? "",
  resourcesBaseUrl,
  upload_bucket_name: uploadBucketName,
  upload_bucket_region: currentRegion,
})

/**
 * Setup Backend Rest API
 */
const {restApi, stage, restApiLambdaRole} = setupBackendRESTApi(environment, {
  mongodb_uri: process.env.MONGODB_URI ?? "",
  resourcesBaseUrl,
  upload_bucket_name: uploadBucketName,
  upload_bucket_region: currentRegion,
  async_lambda_function: asyncLambdaFunction.arn
});

export const backendRestApi = {
  restApiArn: restApi.arn,
  domainName: getRestApiDomainName(stage),
  path: getRestApiPath(stage)
};

// this is the base URL for the backend REST API
export const backedRestApiURLBase = pulumi.interpolate`https://${backendRestApi.domainName}${backendRestApi.path}`;

/**
 * Ensure lambda function of the backend rest api can access the upload bucket
 */

setupUploadBucketPolicy(uploadBucket, restApiLambdaRole, asyncLambdaRole);