// Suppress chatty console during the tests
import "_test_utilities/consoleMock"


// ##############
// Mock the configuration
const mockConfiguration = {
  dbURI: "mongodb://username@password:server:port/database",
  resourcesBaseUrl: "https://path/to/resource"
}
jest.mock("./config/config", () => {
  const originalModule = jest.requireActual("./config/config");
  return {
    ...originalModule,
    readEnvironmentConfiguration: jest.fn().mockImplementation(() => {
      return mockConfiguration;
    })
  }
});

// Mock the connection manager
jest.mock("./connection/connectionManager", () => {
  const originalModule = jest.requireActual("./connection/connectionManager");
  const connectionManagerMock = {
    initialize: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    }),
    getCurrentDBConnection: jest.fn().mockImplementation(() => {
      return {};
    })
  }
  return {
    ...originalModule,
    getConnectionManager: jest.fn().mockReturnValue(connectionManagerMock)
  };
});

// mock the repository registry
jest.mock("./repositoryRegistry/repositoryRegisrty", () => {
  const originalModule = jest.requireActual("./repositoryRegistry/repositoryRegisrty");
  const repositoryRegistryMock = {
    initialize: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    })
  };
  return {
    ...originalModule,
    getRepositoryRegistry: jest.fn().mockReturnValue(repositoryRegistryMock)
  };
});
// ##############

import {getConfiguration, readEnvironmentConfiguration} from "./config/config";
import {getRepositoryRegistry} from "./repositoryRegistry/repositoryRegisrty";
import {getConnectionManager} from "./connection/connectionManager";

describe('Test initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  })
  test("should initialize once", async () => {
    jest.isolateModules(async () => {
      // GIVEN the server is not initialized
      const initModule = require("./init");

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
      expect(readEnvironmentConfiguration).toHaveBeenCalledTimes(1)
      const config = getConfiguration();
      expect(config).toEqual(mockConfiguration);

      // AND the connection manager should be initialized
      expect(getConnectionManager().initialize).toBeCalledTimes(1);
      expect(getConnectionManager().initialize).toBeCalledWith(mockConfiguration.dbURI);

      // AND the repository registry should be initialized
      expect(getRepositoryRegistry().initialize).toBeCalledTimes(1);
    });
  });

  test("should initialize and not throw an error even if connectionManager fails to initialize DB", async () => {
    jest.isolateModules(async () => {

      // GIVEN the connection manager fails to initialize the DB
      getConnectionManager().initialize = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error("DB connection failed"));
      });

      let initModule: typeof import("./init");

      // AND the server is not initialized
      initModule = require("./init");
      expect(initModule.isInitialized()).toBeFalsy();

      // WHEN trying to initialize the server
      const initPromise = initModule.initOnce();

      // THEN the server should be initialized
      await expect(initPromise).resolves.toBeUndefined();
      expect(initModule.isInitialized()).toBeTruthy()
    });
  });
});