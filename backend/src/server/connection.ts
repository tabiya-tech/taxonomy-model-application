import mongoose from 'mongoose';

export async function getConnection(uri: string): Promise<mongoose.Connection> {
  // Setting the sanitizeFilter = true is a failsafe for NoSQL injections. But do not rely on it!
  // Use $eq where possible and write tests to ensure that the queries are not vulnerable to NoSQL with the filter on and off!
  try {
    const connection = await mongoose.set("sanitizeFilter", true).createConnection(uri).asPromise();
    console.info(`Connected to db ${connection.host}:${connection.port}/${connection.name}`);
    connection.on('disconnected', () => {
      console.warn('disconnected');
    });
    connection.on('reconnect', () => {
      console.warn('reconnect');
    });
    connection.on('connected', () => {
      console.info('connected');
    });
    return connection;
  } catch (error: unknown) {
    console.error(error, `Failed to connected to db ${uri}`);
    throw error;
  }
}
