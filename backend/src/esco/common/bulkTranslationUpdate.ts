import mongoose from "mongoose";

// setFields carries dot-notation paths directly into translated Map fields, e.g. "preferredLabel.fr" or
// "altLabels.0.fr", so only that language key of that field is touched; every other language and field is
// left exactly as it was.
export interface ITranslationUpdateOperation {
  importId: string;
  setFields: Record<string, string>;
}

export interface IBulkTranslationUpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

// Merges per-language field updates into existing documents, matched by (modelId, importId). Goes straight to
// the driver's bulkWrite with plain $set operations, bypassing mongoose's document casting/validation, since a
// compound path through an array index into a Map (e.g. "altLabels.0.fr") is not something mongoose's schema
// casting resolves reliably. Never upserts: a document with no matching importId is left untouched.
export async function bulkSetTranslatedFields<T>(
  model: mongoose.Model<T>,
  modelId: string,
  operations: ITranslationUpdateOperation[]
): Promise<IBulkTranslationUpdateResult> {
  if (operations.length === 0) {
    return { matchedCount: 0, modifiedCount: 0 };
  }
  try {
    const modelObjectId = new mongoose.Types.ObjectId(modelId);
    const result = await model.collection.bulkWrite(
      operations.map((operation) => ({
        updateOne: {
          filter: { modelId: { $eq: modelObjectId }, importId: { $eq: operation.importId } },
          update: { $set: operation.setFields },
        },
      })),
      { ordered: false }
    );
    return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  } catch (e: unknown) {
    const err = new Error("bulkSetTranslatedFields: bulkWrite failed", { cause: e });
    console.error(err);
    throw err;
  }
}
