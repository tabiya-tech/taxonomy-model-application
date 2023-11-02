import mongoose from "mongoose";

export async function handleInsertManyError<T>(
  error: unknown,
  callerInfo: string,
  expectedCount: number,
  populateOptions?: mongoose.PopulateOptions[] | mongoose.PopulateOptions
): Promise<T[]> {
  // If the error is a bulk write error, we can still return the inserted documents
  // Such an error will occur if a unique index is violated
  if ((error as { name?: string }).name === "MongoBulkWriteError") {
    const bulkWriteError = error as mongoose.mongo.MongoBulkWriteError;
    console.warn(
      `${callerInfo}: ${bulkWriteError.insertedDocs.length} out of ${expectedCount} documents were inserted successfully.`
    );
    const insertedDocuments: T[] = [];
    for await (const doc of bulkWriteError.insertedDocs) {
      if (populateOptions) {
        await doc.populate(populateOptions);
      }
      insertedDocuments.push(doc.toObject() as T);
    }
    return insertedDocuments;
  }
  console.error(`${callerInfo}: none of the ${expectedCount} documents were inserted.`, error);
  throw error;
}
