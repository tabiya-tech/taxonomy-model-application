// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

// ##############
// Mock the configuration
const mockConfiguration = {
  dbURI: "mongodb://username@password:server:port/database",
  resourcesBaseUrl: "https://path/to/resource",
};
jest.mock("./config", () => {
  const originalModule = jest.requireActual("./config");
  return {
    ...originalModule,
    readEnvironmentConfiguration: jest.fn().mockImplementation(() => {
      return mockConfiguration;
    }),
  };
});

// mock the dependencies registry
jest.mock("./dependencyRegistry", () => {
  const originalModule = jest.requireActual("./dependencyRegistry");
  const dependenciesRegistry = {
    initialize: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    }),
  };
  return {
    ...originalModule,
    getDependencyRegistry: jest.fn().mockReturnValue(dependenciesRegistry),
  };
});

// Mock the connection manager
jest.mock("../server/connection/connectionManager", () => {
  const originalModule = jest.requireActual("../server/connection/connectionManager");
  const connectionManagerMock = {
    initialize: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    }),
  };

  return {
    ...originalModule,
    ConnectionManager: jest.fn().mockImplementation(() => connectionManagerMock),
  };
});

// ##############

import { getConfiguration, readEnvironmentConfiguration } from "./config";
import { getDependencyRegistry } from "./dependencyRegistry";

describe("Test initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize once", async () => {
    await jest.isolateModulesAsync(async () => {
      // GIVEN the server is not initialized
      const initModule = await require("./init");

      expect(initModule.isInitialized()).toBeFalsy();

      // WHEN trying to initialize the server (even more that once )
      const N = 3;
      for (let i = 0; i < N; i++) {
        const initPromise = initModule.initOnce();
        // THEN the server should be initialized
        await expect(initPromise).resolves.toBeUndefined();
        expect(initModule.isInitialized()).toBeTruthy();
      }

      // AND the configuration should be set from the environment variables
      expect(readEnvironmentConfiguration).toHaveBeenCalledTimes(1);
      const config = getConfiguration();
      expect(config).toEqual(mockConfiguration);

      // AND the connection manager should be initialized
      expect(getDependencyRegistry().initialize).toBeCalledTimes(1);
    });
  });

  test("should initialize and not throw an error even if connectionManager fails to initialize DB", async () => {
    await jest.isolateModulesAsync(async () => {
      // GIVEN the connection manager fails to initialize the DB
      getDependencyRegistry().initialize = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error("DB connection failed"));
      });
      // AND the server is not initialized
      const initModule = await import("./init");
      expect(initModule.isInitialized()).toBeFalsy();

      // WHEN trying to initialize the server
      const initPromise = initModule.initOnce();

      // THEN the server should be initialized
      await expect(initPromise).resolves.toBeUndefined();
      expect(initModule.isInitialized()).toBeTruthy();
    });
  });
});
