export const ENV_VAR_NAMES = {
  MONGODB_URI: "MONGODB_URI",
  RESOURCES_BASE_URL: "RESOURCES_BASE_URL",
  UPLOAD_BUCKET_NAME: "UPLOAD_BUCKET_NAME",
  UPLOAD_BUCKET_REGION: "UPLOAD_BUCKET_REGION",
  ASYNC_LAMBDA_FUNCTION_ARN: "ASYNC_LAMBDA_FUNCTION_ARN",
  ASYNC_LAMBDA_FUNCTION_REGION: "ASYNC_LAMBDA_FUNCTION_REGION",
};

export interface IConfiguration {
  dbURI: string;
  resourcesBaseUrl: string;
  uploadBucketName: string;
  uploadBucketRegion: string;
  asyncLambdaFunctionArn: string;
  asyncLambdaFunctionRegion: string;
}
export function readEnvironmentConfiguration(): IConfiguration {
  return {
    dbURI: process.env[ENV_VAR_NAMES.MONGODB_URI] ?? "",
    resourcesBaseUrl: process.env[ENV_VAR_NAMES.RESOURCES_BASE_URL] ?? "",
    uploadBucketName: process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_NAME] ?? "",
    uploadBucketRegion: process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_REGION] ?? "",
    asyncLambdaFunctionArn:
      process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_ARN] ?? "",
    asyncLambdaFunctionRegion:
      process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_REGION] ?? "",
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

export function getAsyncLambdaFunctionArn() {
  return _configuration?.asyncLambdaFunctionArn ?? "";
}
export function getAsyncLambdaFunctionRegion() {
  return _configuration?.asyncLambdaFunctionRegion ?? "";
}
