export function handleInsertManyError<T>(
  error: unknown,
  callerInfo: string,
  expectedCount: number
): mongoose.Document<unknown, unknown, T>[] {
  // If the error is a bulk write error, we can still return the inserted documents
  // Such an error will occur if a unique index is violated
  if ((error as { name?: string }).name === "MongoBulkWriteError") {
    const bulkWriteError = error as mongoose.mongo.MongoBulkWriteError;
    return bulkWriteError.insertedDocs;
  }
  console.error(new Error(`${callerInfo}: none of the ${expectedCount} documents were inserted.`, { cause: error }));
  throw error;
}

import mongoose from "mongoose";
