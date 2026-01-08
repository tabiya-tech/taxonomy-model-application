import { getDependencyRegistry } from "./dependencyRegistry";
import { ConnectionManager } from "../server/connection/connectionManager";
import { getConfiguration, readEnvironmentConfiguration, setConfiguration } from "./config";

let _initialized = false;

/**
 * Initialize the auth module
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
    const connectionManager = new ConnectionManager();
    const connection = await connectionManager.initialize(config?.dbURI as string);

    // initialize the repositories
    await getDependencyRegistry().initialize(connection);
  } catch (e: unknown) {
    console.error(new Error("Error initializing the auth module", { cause: e }));
  }
}

export function isInitialized() {
  return _initialized;
}
