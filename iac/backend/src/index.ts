import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {getRestApiDomainName, getRestApiPath, setupBackendRESTApi} from "./restApi";
import {setupUploadBucket, setupUploadBucketPolicy} from "./uploadBucket";
import {setupAsyncImportApi} from "./asyncImport";
import {setupRedocBucket, setupSwaggerBucket} from "./openapiBuckets";
import {setupDownloadBucket, setupDownloadBucketWritePolicy} from "./downloadBucket";
import {setupAsyncExportApi} from "./asyncExport";
import {setupAuthorizer} from "./authorizer";

export const environment = pulumi.getStack();
export const domainName = process.env.DOMAIN_NAME!;

pulumi.log.info(`Using domain name : ${domainName}`);
if (!domainName) throw new Error("environment variable DOMAIN_NAME is required");

export const publicApiRootPath = "/taxonomy/api";
export const resourcesBaseUrl = `https://${domainName}${publicApiRootPath}`;

export const currentRegion = pulumi.output(aws.getRegion()).name;

const allowedOrigins = [`https://${domainName}`];

/**
 * Setup Download Bucket
 */
const _downloadBucket = setupDownloadBucket(allowedOrigins);
export const downloadBucket = {
  id: _downloadBucket.id,
  arn: _downloadBucket.arn,
  websiteEndpoint: _downloadBucket.bucketRegionalDomainName,
};

/**
 * Setup Async Export
 */

const {asyncExportLambdaRole, asyncExportLambdaFunction} = setupAsyncExportApi(environment, {
  mongodb_uri: process.env.MONGODB_URI ?? "",
  domainName,
  resourcesBaseUrl,
  download_bucket_name: _downloadBucket.id,
  download_bucket_region: currentRegion,
  sentry_backend_dsn: process.env.SENTRY_BACKEND_DSN ?? "",
});

setupDownloadBucketWritePolicy(_downloadBucket, asyncExportLambdaRole);

/**
 * Setup Upload Bucket
 */
if (environment === "dev") {
  allowedOrigins.push("http://localhost:3000"); // Local web server for frontend
  allowedOrigins.push("http://localhost:6006"); // Storybook
}

const uploadBucket = setupUploadBucket(allowedOrigins);
export const uploadBucketName = uploadBucket.id;


/**
 * Setup Async Import
 */

const {asyncImportLambdaRole, asyncImportLambdaFunction} = setupAsyncImportApi(environment, {
  mongodb_uri: process.env.MONGODB_URI ?? "",
  resourcesBaseUrl,
  upload_bucket_name: uploadBucketName,
  upload_bucket_region: currentRegion,
  sentry_backend_dsn: process.env.SENTRY_BACKEND_DSN ?? "",
});

/**
 * Setup Authorizer Lambda
 */

const {authorizerLambdaFunction} = setupAuthorizer(environment, {
  sentry_backend_dsn: process.env.SENTRY_BACKEND_DSN ?? "",
});

/**
 * Setup Backend Rest API
 */
const {restApi, stage, restApiLambdaRole} = setupBackendRESTApi(environment, {
  mongodb_uri: process.env.MONGODB_URI ?? "",
  resourcesBaseUrl,
  upload_bucket_name: uploadBucketName,
  upload_bucket_region: currentRegion,
  download_bucket_name: _downloadBucket.id,
  download_bucket_region: currentRegion,
  async_import_lambda_function_arn: asyncImportLambdaFunction.arn,
  async_export_lambda_function_arn: asyncExportLambdaFunction.arn,
  async_lambda_function_region: currentRegion,
  authorizer_lambda_function_invoke_arn: authorizerLambdaFunction.invokeArn,
  authorizer_lambda_function_name: authorizerLambdaFunction.name,
  sentry_backend_dsn: process.env.SENTRY_BACKEND_DSN ?? "",
});

export const backendRestApi = {
  restApiArn: restApi.arn, domainName: getRestApiDomainName(stage), path: getRestApiPath(stage)
};

// this is the base URL for the backend REST API
export const backedRestApiURLBase = pulumi.interpolate`https://${backendRestApi.domainName}${backendRestApi.path}`;

/**
 * Ensure lambda function of the backend rest api can access the upload bucket
 */

setupUploadBucketPolicy(uploadBucket, restApiLambdaRole, asyncImportLambdaRole);

/**
 * Set up the OpenApi buckets
 */

const _swaggerBucket = setupSwaggerBucket(domainName);

export const swaggerBucket = {
  id: _swaggerBucket.id,
  arn: _swaggerBucket.arn,
  websiteUrl: pulumi.interpolate`http://${_swaggerBucket.websiteEndpoint}`,
  websiteEndpoint: _swaggerBucket.websiteEndpoint
};

const _redocBucket = setupRedocBucket(domainName);

export const redocBucket = {
  id: _redocBucket.id,
  arn: _redocBucket.arn,
  websiteUrl: pulumi.interpolate`http://${_redocBucket.websiteEndpoint}`,
  websiteEndpoint: _redocBucket.websiteEndpoint
};
