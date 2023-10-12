import { getTestConfiguration } from "./getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { randomUUID } from "crypto";

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
    const actualActionPromise = actionCallback(setupResult, givenRepositoryRegistry);

    // THEN expected it to reject with an error
    await expect(actualActionPromise).rejects.toThrowError(/Client must be connected before running operations/);
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
