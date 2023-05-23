export interface IConfiguration {
  dbURI: string;
  resourcesBaseUrl: string;
  uploadBucketName: string;
  uploadBucketRegion: string;
  asyncLambdaFunctionArn: string;
}
export function readEnvironmentConfiguration(): IConfiguration {
  return  {
    dbURI: process.env.MONGODB_URI ?? "",
    resourcesBaseUrl: process.env.RESOURCES_BASE_URL ?? "",
    uploadBucketName: process.env.UPLOAD_BUCKET_NAME ?? "",
    uploadBucketRegion: process.env.UPLOAD_BUCKET_REGION ?? "",
    asyncLambdaFunctionArn: process.env.ASYNC_LAMBDA_FUNCTION_ARN ?? ""
  };
}

let _configuration: IConfiguration | undefined;
export function getConfiguration(): IConfiguration | undefined {
  return _configuration;
}

export function setConfiguration(config: IConfiguration) {
  _configuration = config;
}


export function getDbURI(){
  return _configuration?.dbURI ?? "";
}

export function getResourcesBaseUrl(){
  return _configuration?.resourcesBaseUrl ?? "";
}

export function getUploadBucketName(){
  return _configuration?.uploadBucketName ?? "";
}

export function getUploadBucketRegion(){
  return _configuration?.uploadBucketRegion ?? "";
}

export function getAsyncLambdaFunctionArn(){
  return _configuration?.asyncLambdaFunctionArn ?? "";
}