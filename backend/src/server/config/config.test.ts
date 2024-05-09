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
import { getRandomString, getTestString } from "_test_utilities/specialCharacters";
import * as process from "process";

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

  stdConfigurationValuesTest("getDbURI", getDbURI, "dbURI");

  stdConfigurationValuesTest("getResourcesBaseUrl", getResourcesBaseUrl, "resourcesBaseUrl");

  stdConfigurationValuesTest("getUploadBucketName", getUploadBucketName, "uploadBucketName");

  stdConfigurationValuesTest("getUploadBucketRegion", getUploadBucketRegion, "uploadBucketRegion");

  stdConfigurationValuesTest("getDownloadBucketName", getDownloadBucketName, "downloadBucketName");

  stdConfigurationValuesTest("geDownloadBucketRegion", getDownloadBucketRegion, "downloadBucketRegion");

  stdConfigurationValuesTest(
    "getImportAsyncLambdaFunctionArn",
    getAsyncImportLambdaFunctionArn,
    "asyncImportLambdaFunctionArn"
  );

  stdConfigurationValuesTest(
    "getExportAsyncLambdaFunctionArn",
    getAsyncExportLambdaFunctionArn,
    "asyncExportLambdaFunctionArn"
  );

  stdConfigurationValuesTest("getAsyncLambdaFunctionRegion", getAsyncLambdaFunctionRegion, "asyncLambdaFunctionRegion");

  stdConfigurationValuesTest("getDomainName", getDomainName, "domainName");
});

function stdConfigurationValuesTest(
  getFunctionName: string,
  getFunction: () => string,
  configKey: keyof IConfiguration
) {
  return describe(`Test ${getFunctionName}()`, () => {
    test(`${getFunctionName}() should return the set value`, () => {
      // GIVEN a configuration is set
      const givenConfig = getMockConfig();
      setConfiguration(givenConfig);

      // WHEN calling the getFunction to be tested
      const actualValue = getFunction();

      // THEN expect the getFunction to return the given config value for the tested config key
      expect(actualValue).toEqual(givenConfig[configKey]);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])(`${getFunctionName}() should return '' if the set value %s`, (description, givenValue) => {
      // GIVEN a configuration value of the tested config key is set to the given value
      const config = {
        [configKey]: givenValue,
      };
      // @ts-ignore
      setConfiguration(config);

      // WHEN calling the getFunction to be tested
      const actualValue = getFunction();

      // THEN expect the function to return an empty string
      expect(actualValue).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])(`${getFunctionName}() should return '' if configuration %s`, (description, givenValue) => {
      // GIVEN a configuration is set to the given value
      // @ts-ignore
      setConfiguration(givenValue);

      // WHEN calling the getFunction to be tested
      const actual = getFunction();

      // THEN expect the function to return an empty string
      expect(actual).toEqual("");
    });
  });
}

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
