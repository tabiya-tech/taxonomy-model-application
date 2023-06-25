import mongoose  from 'mongoose';
import {isUnspecified} from "server/isUnspecified";
import {redactCredentialsFromURI} from "server/httpUtils";

export async function getNewConnection(uri: string): Promise<mongoose.Connection> {

  // FAIL FAST if the database uri is not specified
  if (isUnspecified(uri)) {
    const error = Error("Database uri not specified.");
    console.error(error);
    throw error;
  }

  // Setting the sanitizeFilter = true is a failsafe for NoSQL injections. But do not rely on it!
  // Use $eq where possible and write tests to ensure that the queries are not vulnerable to NoSQL with the filter on and off!
  try {
    const connection = await mongoose
      .set("sanitizeFilter", true)
      .set('bufferCommands', true)
      .set('autoIndex', false) // disable automatic index creation for production
      .set('autoCreate', false) // disable automatic creation of collections for production
      .createConnection(uri).asPromise();
    console.info(`Connected to db ${connection.host}:${connection.port}/${connection.name}`);
    return connection;
  } catch (error: unknown) {
    // do not log the error here, because it contains the password
    const redactedUri = redactCredentialsFromURI(uri);
    throw new Error(`Failed to connect to the database ${redactedUri}`);
  }
}
