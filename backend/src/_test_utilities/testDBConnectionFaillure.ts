import { getTestConfiguration } from "./getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { randomUUID } from "crypto";
import { Readable } from "node:stream";
import { ExtendedError } from "extendedError.types";

export function TestDBConnectionFailure<S, A>(
  setupCallback: (repositoryRegistry: RepositoryRegistry) => Promise<S> | S,
  actionCallback: (setupResult: S, repositoryRegistry: RepositoryRegistry) => Promise<A>
) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const givenConfig = getTestConfiguration("ConnectionFailureTestDB" + randomUUID()); // Ensure unique db name to avoid conflicts
    const givenConnection = await getNewConnection(givenConfig.dbURI);
    const givenRepositoryRegistry = new RepositoryRegistry();
    await givenRepositoryRegistry.initialize(givenConnection);

    // AND the setup is done
    const setupResult = await setupCallback(givenRepositoryRegistry);
    // AND the connection is lost
    await givenConnection.close(false);

    // WHEN expect action is called
    // THEN expected it to reject with an error
    try {
      await actionCallback(setupResult, givenRepositoryRegistry);
    } catch (e: unknown) {
      expect((e as ExtendedError).cause?.message).toMatch(/Client must be connected before running operations/);
    }
  });
}

export function TestStreamDBConnectionFailure<S>(
  setupCallback: (repositoryRegistry: RepositoryRegistry) => Promise<S> | S,
  streamActionCallback: (setupResult: S, repositoryRegistry: RepositoryRegistry) => Readable
) {
  return test("should emit an error event when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const givenConfig = getTestConfiguration("ConnectionFailureTestDB" + randomUUID()); // Ensure unique db name to avoid conflicts
    const givenConnection = await getNewConnection(givenConfig.dbURI);
    const givenRepositoryRegistry = new RepositoryRegistry();
    await givenRepositoryRegistry.initialize(givenConnection);

    // AND the setup is done
    const setupResult = await setupCallback(givenRepositoryRegistry);
    // AND the connection is lost
    await givenConnection.close(false);

    // WHEN the action is called
    const actualStreamPromise = new Promise<void>((resolve, reject) => {
      const stream = streamActionCallback(setupResult, givenRepositoryRegistry);
      stream.on("error", (err) => {
        reject(err);
      });
      stream.on("end", () => {
        resolve();
      });
    });

    // THEN expect it to emit a streamError event
    await expect(actualStreamPromise).rejects.toThrowError(/Client must be connected before running operations/);
  });
}

export function TestDBConnectionFailureNoSetup<A>(
  actionCallback: (repositoryRegistry: RepositoryRegistry) => Promise<A>
) {
  return TestDBConnectionFailure<void, A>(
    () => {
      return;
    },
    (_, repositoryRegistry) => actionCallback(repositoryRegistry)
  );
}

export function TestStreamDBConnectionFailureNoSetup(
  streamActionCallback: (repositoryRegistry: RepositoryRegistry) => Readable
) {
  // Use TestStreamDBConnectionFailure with an empty setup callback
  return TestStreamDBConnectionFailure<void>(
    () => {
      return;
    },
    (_, repositoryRegistry) => streamActionCallback(repositoryRegistry)
  );
}
