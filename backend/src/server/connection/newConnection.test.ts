// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "./newConnection";
import { redactCredentialsFromURI } from "server/redactCredentialsFromURI";

describe("Test new connection", () => {
  let dbConnection: Connection;

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.close(true);
    }
  });

  test("should connect to the database", async () => {
    // GIVEN a valid connection string
    dbConnection = await getNewConnection(process.env.MONGODB_URI as string);

    // THEN the connection is established
    expect(dbConnection).toBeDefined();

    // AND the connection is open
    expect(dbConnection.readyState).toBe(1);

    // clean up
    await dbConnection.close(true);
  });

  test("should fail fast if the db uri is not set", async () => {
    // WHEN trying to connect to the database with an empty connection string
    const connectionPromise = getNewConnection("");

    // THEN the connection should fail
    const createConnectionSpy = jest.spyOn(mongoose, "createConnection");
    const connectSpy = jest.spyOn(mongoose, "connect");
    await expect(connectionPromise).rejects.toThrow("Database uri not specified");

    // AND a connection wa never attempted
    expect(createConnectionSpy).toHaveBeenCalledTimes(0);
    expect(connectSpy).toHaveBeenCalledTimes(0);
  });

  test("should reject if the connection fails", async () => {
    // GIVEN the connection to the database fails
    const givenDbUri = "mongodb://username:password@server:port/database";
    // @ts-ignore
    jest.spyOn(mongoose, "createConnection").mockImplementationOnce(() => {
      return {
        asPromise: () => Promise.reject(new Error(givenDbUri)),
      };
    });
    // WHEN trying to connect to the database
    const connectionPromise = getNewConnection(givenDbUri);

    // THEN the connection should fail
    // AND contains the redacted username password uri
    // AND does not contain have any cause because it might leak the password
    await expect(connectionPromise).rejects.toThrowError(
      expect.toMatchErrorWithCause(
        `Failed to connect to the database ${redactCredentialsFromURI(givenDbUri)}`,
        undefined
      )
    );

    await expect(connectionPromise).rejects.not.toThrowError(givenDbUri);
  });
});
