import {
  readEnvironmentConfiguration,
  getUploadBucketName,
  getUploadBucketRegion,
  getDbURI,
  getResourcesBaseUrl,
  setConfiguration,
  getConfiguration,
  IConfiguration, getAsyncLambdaFunctionArn, getAsyncLambdaFunctionRegion
} from "./config";
import {getRandomString, getTestString} from "_test_utilities/specialCharacters";
import {ImportFileTypes} from "api-specifications/import";

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
    process.env.RESOURCES_BASE_URL = getRandomString(10);
    process.env.UPLOAD_BUCKET_NAME = getRandomString(10);
    process.env.UPLOAD_BUCKET_REGION = getRandomString(10);
    process.env.ASYNC_LAMBDA_FUNCTION_ARN = getRandomString(10);
    // WHEN the configuration is read
    const config = readEnvironmentConfiguration();
    expect(config).toMatchObject({
      dbURI: process.env.MONGODB_URI,
      resourcesBaseUrl: process.env.RESOURCES_BASE_URL,
      uploadBucketName: process.env.UPLOAD_BUCKET_NAME,
      uploadBucketRegion: process.env.UPLOAD_BUCKET_REGION,
      asyncLambdaFunctionArn: process.env.ASYNC_LAMBDA_FUNCTION_ARN
    });
  });
  test("readEnvironmentConfiguration() should return default value if environment is not set", () => {
    // GIVEN the environment variables are set
    delete process.env.MONGODB_URI;
    delete process.env.RESOURCES_BASE_URL
    delete process.env.UPLOAD_BUCKET_NAME
    delete process.env.UPLOAD_BUCKET_REGION
    delete process.env.ASYNC_LAMBDA_FUNCTION_ARN
    // WHEN the configuration is read
    const config = readEnvironmentConfiguration();
    expect(config).toMatchObject({
      dbURI: "",
      resourcesBaseUrl: "",
      uploadBucketName: "",
      uploadBucketRegion: "",
      asyncLambdaFunctionArn: ""
    });
  });
});
describe("Test current configuration", () => {

  test("should set/get the configuration", () => {
    // GIVEN a configuration
    const config = getMockConfig();

    // WHEN the configuration is set
    setConfiguration(config);

    // THEN the configuration is returned
    expect(getConfiguration()).toEqual(config);
  })
  describe("Test getDbURI()", () => {

    test("getDbURI() should return the set value", () => {
      // GIVEN a configuration is set
      const config = getMockConfig();
      setConfiguration(config);

      // WHEN getDbURI is called
      const actual = getDbURI()

      // THEN the value is returned
      expect(actual).toEqual(config.dbURI);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getDbURI() should return '' if the set value %s ", (description, value) => {
      // GIVEN a configuration is set
      const config = {
        dbURI: value,
      }
      // @ts-ignore
      setConfiguration(config);

      // WHEN getDbURI is called
      const actual = getDbURI()

      // THEN the value is returned
      expect(actual).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getDbURI() should return '' if the configuration %s ", (description, value) => {
      // GIVEN a configuration is set

      // @ts-ignore
      setConfiguration(value);

      // WHEN getDbURI is called
      const actual = getDbURI()

      // THEN the value is returned
      expect(actual).toEqual("");
    });
  });

  stdConfigurationValuesTest("getResourcesBaseUrl", getResourcesBaseUrl, "resourcesBaseUrl");

  stdConfigurationValuesTest("getUploadBucketName", getUploadBucketName, "uploadBucketName");

  stdConfigurationValuesTest("getUploadBucketRegion", getUploadBucketRegion, "uploadBucketRegion");

  stdConfigurationValuesTest("getAsyncLambdaFunctionArn", getAsyncLambdaFunctionArn, "asyncLambdaFunctionArn");

  stdConfigurationValuesTest("getAsyncLambdaFunctionRegion", getAsyncLambdaFunctionRegion, "asyncLambdaFunctionRegion");
});

function stdConfigurationValuesTest(getFunctionName: string, getFunction: ()=> string, configKey: keyof IConfiguration) {
  return describe(`Test ${getFunctionName}()`, () => {
    test(`${getFunctionName}() should return the set value`, () => {
      // GIVEN a configuration is set
      const config = getMockConfig();
      setConfiguration(config);

      // WHEN getFunction is called
      const actualValue = getFunction()

      // THEN the value is returned
      expect(actualValue).toEqual(config[configKey])
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    (`${getFunctionName}() should return '' if the set value %s`, (description, value) => {
      // GIVEN a configuration is set
      const config = {
        [configKey]: value,
      }
      // @ts-ignore
      setConfiguration(config);

      // WHEN getFunction is called
      const actual = getFunction()

      // THEN the value is returned
      expect(actual).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    (`${getFunctionName}() should return '' if configuration %s`, (description, value) => {
      // GIVEN a configuration is set
      // @ts-ignore
      setConfiguration(value);

      // WHEN getFunction is called
      const actual = getFunction()

      // THEN the value is returned
      expect(actual).toEqual("");
    });
  });
}

function getMockConfig(): IConfiguration {
  return {
    dbURI: getTestString(10),
    resourcesBaseUrl: getTestString(10),
    uploadBucketName: getTestString(10),
    uploadBucketRegion: getTestString(10),
    asyncLambdaFunctionArn: getTestString(10),
    asyncLambdaFunctionRegion: getTestString(10),
  };
}