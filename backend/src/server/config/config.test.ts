import {
  readEnvironmentConfiguration,
  getUploadBucketName,
  getUploadBucketRegion,
  getDbURI,
  getResourcesBaseUrl,
  setConfiguration,
  getConfiguration,
  IConfiguration
} from "./config";
import {getRandomString, getTestString} from "_test_utilities/specialCharacters";

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
    // WHEN the configuration is read
    const config = readEnvironmentConfiguration();
    expect(config).toMatchObject({
      dbURI: process.env.MONGODB_URI,
      resourcesBaseUrl: process.env.RESOURCES_BASE_URL,
      uploadBucketName: process.env.UPLOAD_BUCKET_NAME,
      uploadBucketRegion: process.env.UPLOAD_BUCKET_REGION
    });
  });
  test("readEnvironmentConfiguration() should return default value if environment is not set", () => {
    // GIVEN the environment variables are set
    delete process.env.MONGODB_URI;
    delete process.env.RESOURCES_BASE_URL
    delete process.env.UPLOAD_BUCKET_NAME
    delete process.env.UPLOAD_BUCKET_REGION
    // WHEN the configuration is read
    const config = readEnvironmentConfiguration();
    expect(config).toMatchObject({
      dbURI: "",
      resourcesBaseUrl: "",
      uploadBucketName: "",
      uploadBucketRegion: ""
    });
  });
});
describe("Test current configuration", () => {
  function getMockConfig(): IConfiguration {
    return {
      dbURI: getTestString(10),
      resourcesBaseUrl: getTestString(10),
      uploadBucketName: getTestString(10),
      uploadBucketRegion: getTestString(10)
    };
  }

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

  describe("Test getResourcesBaseUrl()", () => {
    test("getResourcesBaseUrl() should return the set value", () => {
      // GIVEN a configuration is set
      const config = getMockConfig();
      setConfiguration(config);

      // WHEN getDbURI is called
      const dbURI = getResourcesBaseUrl()

      // THEN the value is returned
      expect(dbURI).toEqual(config.resourcesBaseUrl);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getResourcesBaseUrl() should return '' if the set value %s", (description, value) => {
      // GIVEN a configuration is set
      const config = {
        resourcesBaseUrl: value,
      }
      // @ts-ignore
      setConfiguration(config);

      // WHEN getDbURI is called
      const actual = getResourcesBaseUrl()

      // THEN the value is returned
      expect(actual).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getResourcesBaseUrl() should return '' if configuration %s", (description, value) => {
      // GIVEN a configuration is set
      // @ts-ignore
      setConfiguration(value);

      // WHEN getDbURI is called
      const actual = getResourcesBaseUrl()

      // THEN the value is returned
      expect(actual).toEqual("");
    });
  });

  describe("Test getUploadBucketName()", () => {
    test("getUploadBucketName() should return the set value", () => {
      // GIVEN a configuration is set
      const config = getMockConfig();
      setConfiguration(config);

      // WHEN getUploadBucketName is called
      const uploadBucketName = getUploadBucketName()

      // THEN the value is returned
      expect(uploadBucketName).toEqual(config.uploadBucketName);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getUploadBucketName() should return '' if the set value %s", (description, value) => {
      // GIVEN a configuration is set
      const config = {
        uploadBucketName: value,
      }
      // @ts-ignore
      setConfiguration(config);

      // WHEN getUploadBucketName is called
      const actual = getUploadBucketName()

      // THEN the value is returned
      expect(actual).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getUploadBucketName() should return '' if configuration %s", (description, value) => {
      // GIVEN a configuration is set
      // @ts-ignore
      setConfiguration(value);

      // WHEN getUploadBucketName is called
      const actual = getUploadBucketName()

      // THEN the value is returned
      expect(actual).toEqual("");
    });
  });

  describe("Test getUploadBucketRegion()", () => {
    test("getUploadBucketRegion() should return the set value", () => {
      // GIVEN a configuration is set
      const config = getMockConfig();
      setConfiguration(config);

      // WHEN getUploadBucketRegion is called
      const uploadBucketRegion = getUploadBucketRegion()

      // THEN the value is returned
      expect(uploadBucketRegion).toEqual(config.uploadBucketRegion);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getUploadBucketRegion() should return '' if the set value %s", (description, value) => {
      // GIVEN a configuration is set
      const config = {
        uploadBucketRegion: value,
      }
      // @ts-ignore
      setConfiguration(config);

      // WHEN getUploadBucketRegion is called
      const actual = getUploadBucketRegion()

      // THEN the value is returned
      expect(actual).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])
    ("getUploadBucketRegion() should return '' if configuration %s", (description, value) => {
      // GIVEN a configuration is set
      // @ts-ignore
      setConfiguration(value);

      // WHEN getUploadBucketRegion is called
      const actual = getUploadBucketRegion()

      // THEN the value is returned
      expect(actual).toEqual("");
    });
  });
});