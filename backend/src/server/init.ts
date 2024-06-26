import { getConfiguration, readEnvironmentConfiguration, setConfiguration } from "./config/config";
import { getConnectionManager } from "./connection/connectionManager";
import { getRepositoryRegistry } from "./repositoryRegistry/repositoryRegistry";

let _initialized = false;

/**
 * Initialize the database connection and the repositories.
 * This function can be called multiple times, but will only initialize the database connection once.
 *
 */
export async function initOnce(): Promise<void> {
  if (_initialized) {
    return;
  }
  _initialized = true;
  try {
    // Set the current configuration from the environment variables
    setConfiguration(readEnvironmentConfiguration());

    // initialize the database connection
    const config = getConfiguration();
    await getConnectionManager().initialize(config?.dbURI as string);

    // initialize the repositories
    const connection = getConnectionManager().getCurrentDBConnection();
    await getRepositoryRegistry().initialize(connection);
  } catch (e: unknown) {
    console.error(new Error("Error initializing the server", { cause: e }));
  }
}

export function isInitialized() {
  return _initialized;
}
