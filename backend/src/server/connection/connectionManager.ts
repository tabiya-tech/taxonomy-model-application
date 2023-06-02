import {Connection} from 'mongoose';
import {getNewConnection} from "./newConnection";

export class ConnectionManager {
  private _connection: Connection | undefined;

  public getCurrentDBConnection(): Connection | undefined {
    return this._connection;
  }

  public async initialize(uri: string): Promise<Connection> {
    if (this.getCurrentDBConnection()) {
      throw new Error("The database connection has already been initialized.");
    }
    this._connection = await getNewConnection(uri);
    return this._connection;
  }
}

const _connectionManagerInstance = new ConnectionManager();

export function getConnectionManager(): ConnectionManager {
  return _connectionManagerInstance;
}