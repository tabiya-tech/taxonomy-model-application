import * as process from "process";

export const ENV_VAR_NAMES = {
  MONGODB_URI: "MONGODB_URI",
  DOMAIN_NAME: "DOMAIN_NAME",
  RESOURCES_BASE_URL: "RESOURCES_BASE_URL",
  UPLOAD_BUCKET_NAME: "UPLOAD_BUCKET_NAME",
  UPLOAD_BUCKET_REGION: "UPLOAD_BUCKET_REGION",
  DOWNLOAD_BUCKET_REGION: "DOWNLOAD_BUCKET_REGION",
  DOWNLOAD_BUCKET_NAME: "DOWNLOAD_BUCKET_NAME",
  ASYNC_IMPORT_LAMBDA_FUNCTION_ARN: "ASYNC_IMPORT_LAMBDA_FUNCTION_ARN",
  ASYNC_EXPORT_LAMBDA_FUNCTION_ARN: "ASYNC_EXPORT_LAMBDA_FUNCTION_ARN",
  ASYNC_LAMBDA_FUNCTION_REGION: "ASYNC_LAMBDA_FUNCTION_REGION",
};

export interface IConfiguration {
  dbURI: string;
  domainName: string;
  resourcesBaseUrl: string;
  uploadBucketName: string;
  uploadBucketRegion: string;
  downloadBucketName: string;
  downloadBucketRegion: string;
  asyncImportLambdaFunctionArn: string;
  asyncExportLambdaFunctionArn: string;
  asyncLambdaFunctionRegion: string;
}
export function readEnvironmentConfiguration(): IConfiguration {
  return {
    dbURI: process.env[ENV_VAR_NAMES.MONGODB_URI] ?? "",
    domainName: process.env[ENV_VAR_NAMES.DOMAIN_NAME] ?? "",
    resourcesBaseUrl: process.env[ENV_VAR_NAMES.RESOURCES_BASE_URL] ?? "",
    uploadBucketName: process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_NAME] ?? "",
    uploadBucketRegion: process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_REGION] ?? "",
    downloadBucketRegion: process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_REGION] ?? "",
    downloadBucketName: process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_NAME] ?? "",
    asyncImportLambdaFunctionArn: process.env[ENV_VAR_NAMES.ASYNC_IMPORT_LAMBDA_FUNCTION_ARN] ?? "",
    asyncExportLambdaFunctionArn: process.env[ENV_VAR_NAMES.ASYNC_EXPORT_LAMBDA_FUNCTION_ARN] ?? "",
    asyncLambdaFunctionRegion: process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_REGION] ?? "",
  };
}

let _configuration: IConfiguration | undefined;
export function getConfiguration(): IConfiguration | undefined {
  return _configuration;
}

export function setConfiguration(config: IConfiguration) {
  _configuration = config;
}

export function getDbURI() {
  return _configuration?.dbURI ?? "";
}

export function getResourcesBaseUrl() {
  return _configuration?.resourcesBaseUrl ?? "";
}

export function getUploadBucketName() {
  return _configuration?.uploadBucketName ?? "";
}

export function getUploadBucketRegion() {
  return _configuration?.uploadBucketRegion ?? "";
}

export function getDownloadBucketRegion() {
  return _configuration?.downloadBucketRegion ?? "";
}

export function getDownloadBucketName() {
  return _configuration?.downloadBucketName ?? "";
}

export function getAsyncImportLambdaFunctionArn() {
  return _configuration?.asyncImportLambdaFunctionArn ?? "";
}

export function getAsyncExportLambdaFunctionArn() {
  return _configuration?.asyncExportLambdaFunctionArn ?? "";
}

export function getAsyncLambdaFunctionRegion() {
  return _configuration?.asyncLambdaFunctionRegion ?? "";
}

export function getDomainName() {
  return _configuration?.domainName ?? "";
}
