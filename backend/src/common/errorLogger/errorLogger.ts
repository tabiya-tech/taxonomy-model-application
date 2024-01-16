class ErrorLogger {
  private _errorCount: number = 0;
  private _warningCount: number = 0;

  logError(error: unknown): void;
  logError(message: string | object, reason?: unknown): void;
  logError(obj1: unknown, obj2?: unknown) {
    this._errorCount++;
    if (obj2 !== undefined) {
      console.error(obj1, obj2);
    } else {
      console.error(obj1);
    }
    // Here where an error should be logged  in the database with createMany
    // use the getStringFrom(obj1) to get the string representation of the error to be logged into the database
  }

  logWarning(error: unknown): void;
  logWarning(message: string, reason?: unknown): void;
  logWarning(obj1: unknown, obj2?: unknown) {
    this._warningCount++;
    if (obj2 !== undefined) {
      console.warn(obj1, obj2);
    } else {
      console.warn(obj1);
    }
    // Here where a warning should be logged  in the database with createMany
    // use the getStringFrom(obj1) to get the string representation of the warning to be logged into the database
  }

  get errorCount(): number {
    return this._errorCount;
  }

  get warningCount(): number {
    return this._warningCount;
  }

  clear() {
    this._errorCount = 0;
    this._warningCount = 0;
  }
}

// singleton
const errorLoggerInstance = new ErrorLogger();

export default errorLoggerInstance;
