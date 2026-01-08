import {
  readEnvironmentConfiguration,
  getUploadBucketName,
  getUploadBucketRegion,
  getDbURI,
  getResourcesBaseUrl,
  setConfiguration,
  getConfiguration,
  IConfiguration,
  getAsyncExportLambdaFunctionArn,
  getAsyncImportLambdaFunctionArn,
  getAsyncLambdaFunctionRegion,
  getDownloadBucketRegion,
  getDownloadBucketName,
  getDomainName,
} from "./config";
import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { stdConfigurationValuesTest } from "_test_utilities/configurationsValues";

describe("Test read Configuration()", () => {
  const originalEnv: { [key: string]: string } = {};
  beforeAll(() => {
    Object.keys(process.env).forEach((key) => {
      originalEnv[key] = process.env[key] as string;
    });
  });

  afterEach(() => {
    // restore original env variables
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.keys(originalEnv).forEach((key) => {
      process.env[key] = originalEnv[key];
    });
  });

  test("readEnvironmentConfiguration() should read values from the environment", () => {
    // GIVEN the environment variables are set
    process.env.MONGODB_URI = getRandomString(10);
    process.env.DOMAIN_NAME = getRandomString(10);
    process.env.RESOURCES_BASE_URL = getRandomString(10);
    process.env.UPLOAD_BUCKET_NAME = getRandomString(10);
    process.env.UPLOAD_BUCKET_REGION = getRandomString(10);
    process.env.DOWNLOAD_BUCKET_NAME = getRandomString(10);
    process.env.DOWNLOAD_BUCKET_REGION = getRandomString(10);
    process.env.ASYNC_IMPORT_LAMBDA_FUNCTION_ARN = getRandomString(10);
    process.env.ASYNC_EXPORT_LAMBDA_FUNCTION_ARN = getRandomString(10);
    process.env.ASYNC_LAMBDA_FUNCTION_REGION = getRandomString(10);

    // WHEN reading the configuration from the environment
    const actualConfig = readEnvironmentConfiguration();

    // THEN expect the configuration to have the values from the environment variables
    expect(actualConfig).toEqual({
      dbURI: process.env.MONGODB_URI,
      domainName: process.env.DOMAIN_NAME,
      resourcesBaseUrl: process.env.RESOURCES_BASE_URL,
      uploadBucketName: process.env.UPLOAD_BUCKET_NAME,
      uploadBucketRegion: process.env.UPLOAD_BUCKET_REGION,
      downloadBucketName: process.env.DOWNLOAD_BUCKET_NAME,
      downloadBucketRegion: process.env.DOWNLOAD_BUCKET_REGION,
      asyncImportLambdaFunctionArn: process.env.ASYNC_IMPORT_LAMBDA_FUNCTION_ARN,
      asyncExportLambdaFunctionArn: process.env.ASYNC_EXPORT_LAMBDA_FUNCTION_ARN,
      asyncLambdaFunctionRegion: process.env.ASYNC_LAMBDA_FUNCTION_REGION,
    });
  });

  test("readEnvironmentConfiguration() should return default value if environment is not set", () => {
    // GIVEN none of the relevant environment variables are set
    delete process.env.MONGODB_URI;
    delete process.env.DOMAIN_NAME;
    delete process.env.RESOURCES_BASE_URL;
    delete process.env.UPLOAD_BUCKET_NAME;
    delete process.env.UPLOAD_BUCKET_REGION;
    delete process.env.DOWNLOAD_BUCKET_NAME;
    delete process.env.DOWNLOAD_BUCKET_REGION;
    delete process.env.ASYNC_LAMBDA_FUNCTION_ARN;
    delete process.env.ASYNC_LAMBDA_FUNCTION_REGION;

    // WHEN reading the configuration from the environment
    const config = readEnvironmentConfiguration();

    // THEN expect the configuration to have empty values
    expect(config).toEqual({
      dbURI: "",
      domainName: "",
      resourcesBaseUrl: "",
      uploadBucketName: "",
      uploadBucketRegion: "",
      downloadBucketRegion: "",
      downloadBucketName: "",
      asyncImportLambdaFunctionArn: "",
      asyncExportLambdaFunctionArn: "",
      asyncLambdaFunctionRegion: "",
    });
  });
});
describe("Test current configuration", () => {
  test("should set/get the configuration", () => {
    // GIVEN a configuration
    const givenConfig = getMockConfig();

    // WHEN the given configuration is set
    setConfiguration(givenConfig);

    // THEN expect the given configuration to be returned
    expect(getConfiguration()).toEqual(givenConfig);
  });

  stdConfigurationValuesTest(setConfiguration, getMockConfig, "getDbURI", getDbURI, "dbURI");

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getResourcesBaseUrl",
    getResourcesBaseUrl,
    "resourcesBaseUrl"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getUploadBucketName",
    getUploadBucketName,
    "uploadBucketName"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getUploadBucketRegion",
    getUploadBucketRegion,
    "uploadBucketRegion"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getDownloadBucketName",
    getDownloadBucketName,
    "downloadBucketName"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "geDownloadBucketRegion",
    getDownloadBucketRegion,
    "downloadBucketRegion"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getImportAsyncLambdaFunctionArn",
    getAsyncImportLambdaFunctionArn,
    "asyncImportLambdaFunctionArn"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getExportAsyncLambdaFunctionArn",
    getAsyncExportLambdaFunctionArn,
    "asyncExportLambdaFunctionArn"
  );

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getAsyncLambdaFunctionRegion",
    getAsyncLambdaFunctionRegion,
    "asyncLambdaFunctionRegion"
  );

  stdConfigurationValuesTest(setConfiguration, getMockConfig, "getDomainName", getDomainName, "domainName");
});

function getMockConfig(): IConfiguration {
  return {
    dbURI: getTestString(10),
    domainName: getTestString(10),
    resourcesBaseUrl: getTestString(10),
    uploadBucketName: getTestString(10),
    uploadBucketRegion: getTestString(10),
    downloadBucketRegion: getTestString(10),
    downloadBucketName: getTestString(10),
    asyncImportLambdaFunctionArn: getTestString(10),
    asyncExportLambdaFunctionArn: getTestString(10),
    asyncLambdaFunctionRegion: getTestString(10),
  };
}
