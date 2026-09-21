import mongoose from "mongoose";
import { initializeSchemaAndModel, ModelName } from "../../src/modelInfo/modelInfoModel";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Sets availableLanguages on every model that predates the field.
 *
 * A model that was created before the field existed carries data in a single language, the one its locale implies,
 * so that is what it is given. The locale itself is orthogonal to the field and is not touched.
 */

/**
 * The language a model carries data in, derived from the short code of its locale.
 *
 * The rule is hardcoded on purpose: it describes the data as it is today, not a general mapping of locales to
 * languages. Every locale whose short code ends with "es" is a Spanish one, e.g. "AR-es", and every other locale,
 * e.g. "ZA", is an English one.
 */
const SPANISH_LOCALE_SHORT_CODE_SUFFIX = "es";
const SPANISH_SHORT_CODE = "es";
const ENGLISH_SHORT_CODE = "en";

/**
 * Returns the short code of the language a model carries data in.
 * @param localeShortCode the short code of the locale of the model, e.g. "AR-es"
 * @returns "es" when the locale is a Spanish one, "en" otherwise, also when the model carries no locale at all
 */
function getLanguageShortCode(localeShortCode: unknown): string {
  const normalizedShortCode = typeof localeShortCode === "string" ? localeShortCode.trim().toLowerCase() : "";
  return normalizedShortCode.endsWith(SPANISH_LOCALE_SHORT_CODE_SUFFIX) ? SPANISH_SHORT_CODE : ENGLISH_SHORT_CODE;
}

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
    "Sets availableLanguages on every model that does not declare any, to the language its locale implies: 'es' " +
    "when the short code of the locale ends with 'es', e.g. 'AR-es', and 'en' otherwise. " +
    "Down removes the field from every model, the shape the collection had before the migration.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    const collection = getModelInfoCollection(connection);
    // only the locale is read, the language is derived from it in memory, so that the models are read in one request
    const models = await collection
      .find(MODELS_WITHOUT_AVAILABLE_LANGUAGES, { projection: { "locale.shortCode": 1 } })
      .toArray();
    if (models.length === 0) {
      console.info("Every model already declares the languages it carries data in, nothing to do.");
      return { matched: 0, modified: 0 };
    }

    // the models are grouped by the language they are given, so that they are written with one request per language
    // instead of one request per model
    const modelIdsByShortCode = new Map<string, mongoose.Types.ObjectId[]>();
    for (const model of models) {
      const shortCode = getLanguageShortCode(model.locale?.shortCode);
      const modelIds = modelIdsByShortCode.get(shortCode) ?? [];
      modelIds.push(model._id);
      modelIdsByShortCode.set(shortCode, modelIds);
    }

    const result = await collection.bulkWrite(
      [...modelIdsByShortCode].map(([shortCode, modelIds]) => ({
        updateMany: {
          filter: { _id: { $in: modelIds } },
          update: { $set: { availableLanguages: [shortCode] } },
        },
      }))
    );
    for (const [shortCode, modelIds] of modelIdsByShortCode) {
      console.info(`Set availableLanguages to '${shortCode}' on ${modelIds.length} model(s).`);
    }
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
