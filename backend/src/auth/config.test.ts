import {
  readEnvironmentConfiguration,
  getDbURI,
  setConfiguration,
  getConfiguration,
  IConfiguration,
  getUserPoolClientId,
  getUserPoolId,
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
    process.env.AUTH_DATABASE_URI = getRandomString(10);
    process.env.USER_POOL_ID = getRandomString(10);
    process.env.USER_POOL_CLIENT_ID = getRandomString(10);

    // WHEN reading the configuration from the environment
    const actualConfig = readEnvironmentConfiguration();

    // THEN expect the configuration to have the values from the environment variables
    expect(actualConfig).toEqual({
      dbURI: process.env.AUTH_DATABASE_URI,
      userPoolId: process.env.USER_POOL_ID,
      userPoolClientId: process.env.USER_POOL_CLIENT_ID,
    });
  });

  test("readEnvironmentConfiguration() should return default value if environment is not set", () => {
    // GIVEN none of the relevant environment variables are set
    delete process.env.AUTH_DATABASE_URI;
    delete process.env.USER_POOL_ID;
    delete process.env.USER_POOL_CLIENT_ID;

    // WHEN reading the configuration from the environment
    const config = readEnvironmentConfiguration();

    // THEN expect the configuration to have empty values
    expect(config).toEqual({
      dbURI: "",
      userPoolId: "",
      userPoolClientId: "",
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

  stdConfigurationValuesTest(setConfiguration, getMockConfig, "getUserPoolId", getUserPoolId, "userPoolId");

  stdConfigurationValuesTest(
    setConfiguration,
    getMockConfig,
    "getUserPoolClientId",
    getUserPoolClientId,
    "userPoolClientId"
  );
});

function getMockConfig(): IConfiguration {
  return {
    dbURI: getTestString(10),
    userPoolId: getTestString(10),
    userPoolClientId: getTestString(10),
  };
}
