// Setup the mocks
// Mock the connection module
import {Connection} from "mongoose";
import {RepositoryRegistry} from "./repositories";
import {IConfiguration} from "./server/config";

export {};
jest.mock("./server/connection", () => {
  return {
    getConnection: jest.fn()
  };
});

// Mock the ModelRepository module
jest.mock('./modelInfo/ModelRepository', () => {
  // Works and lets you check for constructor calls:
  return {
    ModelRepository: jest.fn()
  };
});

// Mock the modelInfoModel module
jest.mock('./modelInfo/modelInfoModel', () => {
  // Works and lets you check for constructor calls:
  return {
    initializeSchemaAndModel: jest.fn()
  };
});
//--------------------------------------------------------------

let connectionModule: { getConnection: any; };

let initModule: {
  isInitialized: () => boolean;
  initOnce: (config: any) => Promise<Connection>,
  _initTOBE_RENAMED: (config: any) => Promise<{ connection: Connection, repositories: RepositoryRegistry }>
};

function getTestConfig(): IConfiguration {
  return {dbURI: "foo", resourcesBaseUrl: "bar"};
}

describe("test the initOnce function", () => {
  beforeEach(() => {
    jest.resetModules();
    initModule = require('./init');
    connectionModule = require("./server/connection");
  })

  test('should initialize the database connection', async () => {
    // GIVEN a configuration
    const givenConfig: IConfiguration = getTestConfig();

    // WHEN init is called with that configuration
    await initModule.initOnce(givenConfig);

    // THEN  getConnection() should be called with the dbURI from the configuration
    expect(connectionModule.getConnection).toBeCalledWith(givenConfig.dbURI);
  })

  test('should reject with and error and remain uninitialized if database connection fails', async () => {
    // GIVEN a configuration
    const givenConfig: IConfiguration = getTestConfig();
    // AND getConnection() rejects
    const givenError = new Error("some error");
    // @ts-ignore
    connectionModule.getConnection.mockRejectedValue(givenError);
    // AND init is not initialized
    expect(initModule.isInitialized()).toBe(false);

    // WHEN init is called with that configuration
    const initPromise = initModule.initOnce(givenConfig);

    // THEN  getConnection() should be called with the dbURI from the configuration
    expect(connectionModule.getConnection).toBeCalledWith(givenConfig.dbURI);

    // AND init should reject with the error
    await expect(initPromise).rejects.toEqual(givenError);

    // AND init should remain uninitialized
    expect(initModule.isInitialized()).toBe(false);
  });


  test('should initialize repositories', async () => {
    // GIVEN a configuration
    const givenConfig: IConfiguration = getTestConfig();

    // WHEN init is called with that configuration
    await initModule.initOnce(givenConfig);

    // THEN the repositories should have been initialized
    const repositories = require("./repositories").repositories;
    expect(repositories.modelInfo).toBeDefined();
  });

  test('should initialize repositories the database connection only once', async () => {
    // GIVEN a configuration
    const givenConfig = getTestConfig();
    // AND initModule has not been initialized
    expect(initModule.isInitialized()).toBe(false);

    // WHEN calling the init function N times
    const N = 3;
    for (let i = 0; i < N; i++) {
      await initModule.initOnce(givenConfig)
    }

    // THEN getConnection should be called once
    expect(connectionModule.getConnection).toBeCalledTimes(1)

    expect(initModule.isInitialized()).toBe(true);
  })


  test('should skip repositories the database connection when not db uri provided', async () => {
    // GIVEN a configuration without a dbURI
    const givenConfig = {};

    // AND initModule has not been initialized
    expect(initModule.isInitialized()).toBe(false);

    // WHEN calling the init function
      await initModule.initOnce(givenConfig)

    // THEN getConnection should not be called
    expect(connectionModule.getConnection).toBeCalledTimes(0)

    expect(initModule.isInitialized()).toBe(true);
  })


  test('should initialize', async () => {
    // GIVEN any configuration
    const givenConfig = {};
    // AND initModule has not been initialized
    expect(initModule.isInitialized()).toBe(false);

    // WHEN calling the init function
    await initModule.initOnce(givenConfig);

    // THEN it should be initialized
    expect(initModule.isInitialized()).toBe(true);
  })
})