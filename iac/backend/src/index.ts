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


// =======================
// Sanity Checks for environment variables.
// =======================
pulumi.log.info(`Using domain name : ${domainName}`);
if (!domainName) throw new Error("environment variable DOMAIN_NAME is required");

const mongoDbUri = process.env.MONGODB_URI;
if(!mongoDbUri) throw new Error("environment variable MONGODB_URI is required")

const authDatabaseURI = process.env.AUTH_DATABASE_URI;
if(!authDatabaseURI) throw new Error("environment variable AUTH_DATABASE_URI is required")

const sentryBackendDSN = process.env.SENTRY_BACKEND_DSN ?? "";

const userPoolId = process.env.USER_POOL_ID;
if(!userPoolId)
  throw new Error("environment variable USER_POOL_ID is required");

const userPoolClientId = process.env.USER_POOL_CLIENT_ID;
if(!userPoolClientId)
  throw new Error("environment variable USER_POOL_CLIENT_ID is required");

// ============================

export const publicApiRootPath = "/api";
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
  mongodb_uri: mongoDbUri,
  domainName,
  resourcesBaseUrl,
  download_bucket_name: _downloadBucket.id,
  download_bucket_region: currentRegion,
  sentry_backend_dsn: sentryBackendDSN,
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
  mongodb_uri: mongoDbUri,
  resourcesBaseUrl,
  upload_bucket_name: uploadBucketName,
  upload_bucket_region: currentRegion,
  sentry_backend_dsn: sentryBackendDSN,
});

/**
 * Setup Authorizer Lambda
 */
const {authorizerLambdaFunction} = setupAuthorizer(environment, {
  sentry_backend_dsn: sentryBackendDSN,
  user_pool_id: userPoolId,
  user_pool_client_id: userPoolClientId,
});

/**
 * Set up Backend Rest API (creates usage plans and references authorizer)
 */
const {restApi, stage, restApiLambdaRole} = setupBackendRESTApi(environment, {
  mongodb_uri: mongoDbUri,
  auth_database_uri: authDatabaseURI,
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
  sentry_backend_dsn: sentryBackendDSN,
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
