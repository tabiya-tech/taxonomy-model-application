import mongoose from "mongoose";
import { initializeSchemaAndModel, ModelName } from "../../src/modelInfo/modelInfoModel";
import { getFallbackLanguageConfig } from "../../src/common/language/fallbackLanguage";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Sets availableLanguages on every model that predates the field.
 *
 * A model that was created before the field existed carries data in a single language, the fall back language of the
 * environment, so that is what it is given. The field is orthogonal to the locale of the model, which this migration
 * does not touch.
 */

/**
 * Returns the collection of the ModelInfo entries, taken from the model so that its name is never hardcoded here.
 * The model is registered on the connection only when the connection does not carry it already, as mongoose refuses
 * to compile the same model twice.
 */
function getModelInfoCollection(connection: mongoose.Connection): mongoose.Collection {
  const model = connection.models[ModelName] ?? initializeSchemaAndModel(connection);
  return model.collection;
}

/**
 * The models that do not declare the languages they carry data in: the field is missing, null, or an empty list.
 * Filtering on it is what makes the migration idempotent and resumable, an already migrated model is not matched.
 */
const MODELS_WITHOUT_AVAILABLE_LANGUAGES = {
  $or: [{ availableLanguages: { $exists: false } }, { availableLanguages: null }, { availableLanguages: { $size: 0 } }],
};

const migration: IMigration = {
  name: "0001-model-info-available-languages",
  description:
    "Sets availableLanguages to the fall back language on every model that does not declare any. " +
    "Down removes the field from every model, the shape the collection had before the migration.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    const fallbackShortCode = getFallbackLanguageConfig().shortCode;
    const collection = getModelInfoCollection(connection);
    const result = await collection.updateMany(MODELS_WITHOUT_AVAILABLE_LANGUAGES, {
      $set: { availableLanguages: [fallbackShortCode] },
    });
    console.info(`Set availableLanguages to ['${fallbackShortCode}'] on ${result.modifiedCount} model(s).`);
    return { matched: result.matchedCount, modified: result.modifiedCount };
  },

  async down(connection: mongoose.Connection): Promise<IMigrationResult> {
    // The field did not exist before the migration, so reverting it is removing it from every model, not only from
    // the ones that up() touched. A model that declares more than one language loses that declaration, which is why
    // the runbook asks for a snapshot before a down.
    const collection = getModelInfoCollection(connection);
    const result = await collection.updateMany(
      { availableLanguages: { $exists: true } },
      { $unset: { availableLanguages: "" } }
    );
    console.info(`Removed availableLanguages from ${result.modifiedCount} model(s).`);
    return { matched: result.matchedCount, modified: result.modifiedCount };
  },
};

export default migration;
