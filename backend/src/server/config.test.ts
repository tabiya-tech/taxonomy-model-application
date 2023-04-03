import {getConfiguration, getDbURI, getResourcesBaseUrl} from "./config";
import {getRandomString, getTestString} from "../_test_utilities/specialCharacters";

describe("Test the configuration", () => {
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

  test("getConfiguration() should return return correct values", () => {
    // GIVEN the environment variables are set
    process.env.MONGODB_URI = getRandomString(10);
    process.env.RESOURCES_BASE_URL = getRandomString(10);
    // WHEN the configuration is read
    const config  = getConfiguration();
    expect(config).toMatchObject({
      dbURI: process.env.MONGODB_URI,
      resourcesBaseUrl: process.env.RESOURCES_BASE_URL
    });
  });

  test("getDbURI() should return correct value", () => {
    // GIVEN the environment variables are set
    const someString = getRandomString(10);
    process.env.MONGODB_URI = someString;
    // WHEN getDbURI is called
    const dbURI = getDbURI()
    // THEN the value is returned
    expect(dbURI).toEqual(someString);
  });

  test("getDbURI() should return correct value", () => {
    // GIVEN the environment variables are set
    const someString = getRandomString(10);
    process.env.RESOURCES_BASE_URL =  someString;
    // WHEN getDbURI is called
    const dbURI = getResourcesBaseUrl()
    // THEN the value is returned
    expect(dbURI).toEqual(someString);
  });

});