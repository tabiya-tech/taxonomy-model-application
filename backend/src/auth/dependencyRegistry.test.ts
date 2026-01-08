// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { getDependencyRegistry, DependencyRegistry } from "./dependencyRegistry";
import { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";

describe("test the DependenciesRegistry", () => {
  let dbConnection: Connection;

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  test("should return a singleton DependenciesRegistry", () => {
    // WHEN trying to get the DependenciesRegistry
    const dependenciesRegistry = getDependencyRegistry();

    // THEN the DependenciesRegistry should be returned
    expect(dependenciesRegistry).toBeInstanceOf(DependencyRegistry);

    // AND the DependenciesRegistry should be a singleton
    const dependenciesRegistry2 = getDependencyRegistry();
    expect(dependenciesRegistry).toEqual(dependenciesRegistry2);
  });

  test("should initialize and set dependencies successfully", async () => {
    // GIVEN a connection to the database
    dbConnection = await getNewConnection(process.env.MONGODB_URI as string);

    // WHEN trying to initialize the DependenciesRegistry
    const dependenciesRegistry = new DependencyRegistry();
    await dependenciesRegistry.initialize(dbConnection);

    // THEN the repositories should be initialized
    expect(dependenciesRegistry.accessKey).toBeDefined();
  });
});
