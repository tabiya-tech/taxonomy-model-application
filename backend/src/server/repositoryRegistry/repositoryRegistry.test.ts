// Suppress chatty console during the tests
import "_test_utilities/consoleMock"

import {getRepositoryRegistry, RepositoryRegistry} from "./repositoryRegistry";
import {Connection} from "mongoose";
import {getNewConnection} from "server/connection/newConnection";

describe("test the RepositoryRegistry", () => {


  let dbConnection: Connection;

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close(false);  // do not force close as there might be pending mongo operations
    }
  });

  test("should return a singleton RepositoryRegistry", () => {
    // WHEN trying to get the RepositoryRegistry
    const repositoryRegistry = getRepositoryRegistry();

    // THEN the RepositoryRegistry should be returned
    expect(repositoryRegistry).toBeInstanceOf(RepositoryRegistry);

    // AND the RepositoryRegistry should be a singleton
    const repositoryRegistry2 = getRepositoryRegistry();
    expect(repositoryRegistry).toEqual(repositoryRegistry2);
  });

  test("should initialize and set repositories successfully", async () => {
    // GIVEN a connection to the database
    dbConnection = await getNewConnection(process.env.MONGODB_URI as string);

    // WHEN trying to initialize the RepositoryRegistry
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);

    // THEN the repositories should be initialized
    expect(repositoryRegistry.modelInfo).toBeDefined();
    expect(repositoryRegistry.ISCOGroup).toBeDefined();
    expect(repositoryRegistry.skillGroup).toBeDefined();
    expect(repositoryRegistry.skill).toBeDefined();
    expect(repositoryRegistry.occupation).toBeDefined();
    expect(repositoryRegistry.occupationHierarchy).toBeDefined();
    expect(repositoryRegistry.importProcessState).toBeDefined();
  });

  test("should reject the connection is not defined", async () => {

    // WHEN trying to initialize the RepositoryRegistry with an undefined connection
    const repositoryRegistry = new RepositoryRegistry();
    const initializePromise = repositoryRegistry.initialize(undefined);

    // THEN it should reject with an error
    await expect(initializePromise).rejects.toThrowError("Connection is undefined");
  });
});