// *********
// Setup the connection module mock that is needed by the initializeDB function
jest.mock("./newConnection", () => {
  return {
    __esModule: true,
    getNewConnection: jest.fn()
  };
});
// ********************

import {getConnectionManager, ConnectionManager} from "./connectionManager";
import {Connection} from "mongoose";
import {getNewConnection} from "./newConnection";

describe('Test the ConnectionManager', () => {
  test('should return a singleton connection manager', () => {
    // WHEN trying to get the connection manager
    const connectionManager = getConnectionManager();

    // THEN the connection manager should be returned
    expect(connectionManager).toBeInstanceOf(ConnectionManager);
    // AND the connection manager should be a singleton
    const connectionManager2 = getConnectionManager();
    expect(connectionManager).toEqual(connectionManager2);
  })

  test('should initialize and set the current connection', async () => {
    // GIVEN a connection string
    const dbUri = "mongodb://username@password:server:port/database"
    // AND the connection to the database will succeed
    // @ts-ignore
    const mockConnection = {foo: "bar"} as Connection;
    // @ts-ignore
    getNewConnection.mockResolvedValueOnce(mockConnection);

    // WHEN trying to initialize the connection of the connection manager
    const connectionManager = new ConnectionManager();

    const actualConnection = await connectionManager.initialize(dbUri);

    // THEN the connection should be initialized
    expect(getNewConnection).toHaveBeenCalledWith(dbUri);
    // AND the connection should be returned
    expect(actualConnection).toEqual(mockConnection);
    // AND the current connection should be set
    expect(connectionManager.getCurrentDBConnection()).toEqual(mockConnection);
  });

  test('should fail to initialize if the current connection is already set', async () => {
    // GIVEN the connection is already set
    // Mock the getCurrentDBConnection function
    const connectionManager =  new ConnectionManager();
    // @ts-ignore
    jest.spyOn(connectionManager, 'getCurrentDBConnection').mockReturnValueOnce({foo: "bar"} as Connection);

    // WHEN trying to initialize the connection
    const dbUri = "mongodb://username@password:server:port/database"
    const actualConnectionPromise = connectionManager.initialize(dbUri);

    // THEN the initialization should fail
    await expect(actualConnectionPromise).rejects.toThrowError("The database connection has already been initialized.");
  })
});