import mongoose from "mongoose";
import { initializeSchemaAndModel } from "../../src/esco/occupations/model/occupation.model";
import { getFallbackLanguageConfig } from "../../src/common/language/fallbackLanguage";
import { MongooseModelName } from "../../src/esco/common/mongooseModelNames";
import { IOccupationDoc } from "../../src/esco/occupations/_shared/occupation.types";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Rewrites the Occupation collection's translatable fields between a plain string (or array, for altLabels) and a
 * localized sub document keyed by the fallback language, e.g. "Cook" <-> { en: "Cook" }.
 */

const BATCH_SIZE = 500;
const STRING_FIELDS = ["preferredLabel", "description", "definition", "scopeNote", "regulatedProfessionNote"];

// reuses the model if the connection already has it registered, since mongoose refuses to register one twice
function getOccupationCollection(connection: mongoose.Connection): mongoose.Collection {
  const model =
    (connection.models[MongooseModelName.Occupation] as mongoose.Model<IOccupationDoc>) ??
    initializeSchemaAndModel(connection);
  return model.collection;
}

// true when the field is still in the old, pre-migration (flat string) shape
function isFlatString(value: unknown): value is string {
  return typeof value === "string";
}

// an empty array is indistinguishable from the migrated shape, and is left untouched to stay idempotent
function isFlatStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");
}

// returns the $set update to localize a document, or null when it is already in the new shape
export function buildMigrationUpdate(doc: Record<string, unknown>): Record<string, unknown> | null {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  const update: Record<string, unknown> = {};

  STRING_FIELDS.forEach((field) => {
    const value = doc[field];
    if (isFlatString(value)) {
      update[field] = { [fallbackDbKeyName]: value };
    }
  });

  if (isFlatStringArray(doc.altLabels)) {
    update.altLabels = (doc.altLabels as string[]).map((label) => ({ [fallbackDbKeyName]: label }));
  }

  return Object.keys(update).length > 0 ? update : null;
}

// true when the field is a localized sub document, i.e. an object keyed by language rather than a flat string
function isLocalizedValue(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// returns the $set update to flatten a document back to the fallback language, or null when already flat
function buildRevertUpdate(doc: Record<string, unknown>, fallbackDbKeyName: string): Record<string, unknown> | null {
  const update: Record<string, unknown> = {};

  STRING_FIELDS.forEach((field) => {
    const value = doc[field];
    if (isLocalizedValue(value)) {
      update[field] = value[fallbackDbKeyName] ?? "";
    }
  });

  if (Array.isArray(doc.altLabels) && doc.altLabels.some(isLocalizedValue)) {
    update.altLabels = (doc.altLabels as Record<string, string>[]).map((item) =>
      isLocalizedValue(item) ? item[fallbackDbKeyName] ?? "" : item
    );
  }

  return Object.keys(update).length > 0 ? update : null;
}

// applies buildUpdate to every document of the collection, in batches, and returns the matched/modified counts;
// a batch failure is logged and does not abort the run, so one bad document does not block the rest
async function migrateInBatches(
  connection: mongoose.Connection,
  projection: Record<string, 1>,
  buildUpdate: (doc: Record<string, unknown>) => Record<string, unknown> | null,
  logLabel: string
): Promise<IMigrationResult> {
  const collection = getOccupationCollection(connection);
  let matched = 0;
  let modified = 0;
  const cursor = collection.find({}, { projection });
  let batch: Parameters<typeof collection.bulkWrite>[0] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const batchSize = batch.length;
    try {
      await collection.bulkWrite(batch, { ordered: false });
      modified += batchSize;
    } catch (error: unknown) {
      const writtenCount = (error as { modifiedCount?: number })?.modifiedCount ?? 0;
      modified += writtenCount;
      console.error(`${logLabel}: a batch of ${batchSize} documents failed.`, error);
    } finally {
      batch = [];
    }
  };

  for await (const doc of cursor) {
    const update = buildUpdate(doc as unknown as Record<string, unknown>);
    if (!update) continue;
    matched++;
    batch.push({ updateOne: { filter: { _id: doc._id }, update: { $set: update } } });
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  return { matched, modified };
}

export async function migrateOccupationsLocalizedFields(connection: mongoose.Connection): Promise<IMigrationResult> {
  return migrateInBatches(
    connection,
    { preferredLabel: 1, description: 1, definition: 1, scopeNote: 1, regulatedProfessionNote: 1, altLabels: 1 },
    buildMigrationUpdate,
    "Occupations localized fields migration"
  );
}

const migration: IMigration = {
  name: "0002-occupations-localized-fields",
  description:
    "Rewrites the Occupation collection's translatable fields into localized sub documents keyed by the fallback " +
    "language. Down flattens them back to a plain string/array of the fallback language's value.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    const result = await migrateOccupationsLocalizedFields(connection);
    console.info(`Localized the translatable fields of ${result.modified} occupation(s).`);
    return result;
  },

  async down(connection: mongoose.Connection): Promise<IMigrationResult> {
    const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
    const result = await migrateInBatches(
      connection,
      { preferredLabel: 1, description: 1, definition: 1, scopeNote: 1, regulatedProfessionNote: 1, altLabels: 1 },
      (doc) => buildRevertUpdate(doc, fallbackDbKeyName),
      "Occupations localized fields migration (down)"
    );
    console.info(`Flattened the translatable fields of ${result.modified} occupation(s).`);
    return result;
  },
};

export default migration;
