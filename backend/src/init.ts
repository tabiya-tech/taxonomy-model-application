import {getConnection} from "./server/connection";
import {initializeSchemaAndModel} from "./modelInfo/modelInfoModel";
import {ModelRepository} from "./modelInfo/ModelRepository";
import {repositories, RepositoryRegistry} from "./repositories";
import {Connection} from "mongoose";
import mongoose from "mongoose";
import {IConfiguration} from "./server/config";
import {isUnspecified} from "./server/isUnspecified";

let initialized = false;
let  connection: Connection;
/**
 * Initialize the database connection and the repositories.
 * This function can be called multiple times, but will only initialize the database connection once.
 *
 * @param config
 */
export async function initOnce(config: IConfiguration): Promise<Connection> {
  if (initialized) {
    // @ts-ignore
    return connection;
  }
  if (isUnspecified(config.dbURI)) { // FAIL FAST if the database uri is not specified
    console.error("Database uri not specified. Is the environment variable MONGODB_URI set");
    initialized = true;
    // @ts-ignore
    return null;
  }
  const result = await initialize(config);
  connection = result.connection;
  repositories.modelInfo = result.repositories.modelInfo;
  initialized = true;
  return connection;
}

export function getCurrentDBConnection(): Connection {
  return connection;
}

export function isInitialized() {
  return initialized;
}


/**
 * Initialize the database connection and the repositories.
 * This function will initialize a new database connection every time it is called.
 *
 * @param config
 */
export async function initialize(config:IConfiguration): Promise<{connection: Connection,repositories: RepositoryRegistry}> {

  // Initialize a database connection
  const _connection = await getConnection(config.dbURI);

  // Set up mongoose
  // Apply to all schemas the transforms to get lean representations of the documents
  const toFunction = {
    virtuals: true,
    versionKey: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(doc: any, ret: any) {
      // Delete any object attributes we do not need in our projections
      //delete ret.id;
      delete ret._id;
      delete ret.__v;
    }
  };
  mongoose.plugin((schema) => {
    // @ts-ignore
    schema.options.toObject = toFunction;
    // @ts-ignore
    schema.options.toJSON = toFunction;
  });

  // Set up the repositories
  const _repositories = new RepositoryRegistry();
  _repositories.modelInfo = new ModelRepository(initializeSchemaAndModel(_connection));

  return {connection: _connection, repositories: _repositories};
}






