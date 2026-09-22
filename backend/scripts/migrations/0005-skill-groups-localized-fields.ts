import mongoose from "mongoose";
import LanguageAPISpecs from "api-specifications/language";
import { initializeSchemaAndModel as initializeSkillGroupSchemaAndModel } from "../../src/esco/skillGroup/model/SkillGroup.model";
import {
  initializeSchemaAndModel as initializeModelInfoSchemaAndModel,
  ModelName as ModelInfoModelName,
} from "../../src/modelInfo/modelInfoModel";
import { MongooseModelName } from "../../src/esco/common/mongooseModelNames";
import { getFallbackLanguageConfig } from "../../src/common/language/fallbackLanguage";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Rewrites the translatable fields of every skill group into localized sub documents.
 *
 * A skill group that predates the localized schema carries its translatable fields as flat values, in a single
 * language, the first language its model declares:
 *
 *   { preferredLabel: "Management", description: "...", scopeNote: "...", altLabels: ["a", "b"] }
 *
 * becomes
 *
 *   { preferredLabel: { en: "Management" }, description: { en: "..." }, scopeNote: { en: "..." },
 *     altLabels: [{ en: "a" }, { en: "b" }] }
 *
 * code is monolingual and is left untouched, so the code validation of the schema keeps working unchanged. A skill
 * group carries no definition and no regulatedProfessionNote, so neither is touched nor added.
 */

/** The translatable fields that hold a single value, i.e. one localized sub document each. */
const TRANSLATABLE_STRING_FIELDS = ["preferredLabel", "description", "scopeNote"] as const;

/** The translatable fields that hold a list of values, i.e. an array of localized sub documents each. */
const TRANSLATABLE_ARRAY_FIELDS = ["altLabels"] as const;

/**
 * Returns the collection of the skill groups, taken from the model so that its name is never hardcoded here.
 * The model is registered on the connection only when the connection does not carry it already, as mongoose refuses
 * to compile the same model twice.
 */
function getSkillGroupCollection(connection: mongoose.Connection): mongoose.Collection {
  const model = connection.models[MongooseModelName.SkillGroup] ?? initializeSkillGroupSchemaAndModel(connection);
  return model.collection;
}

/** Returns the collection of the ModelInfo entries, in the same way as the one of the skill groups. */
function getModelInfoCollection(connection: mongoose.Connection): mongoose.Collection {
  const model = connection.models[ModelInfoModelName] ?? initializeModelInfoSchemaAndModel(connection);
  return model.collection;
}

/**
 * The skill groups that still carry at least one flat translatable value: a single value that is a string, or a
 * list whose first item is a string. Filtering on the shape is what makes the migration idempotent and resumable, an
 * already migrated group is not matched and a run that was interrupted halfway can simply be run again.
 */
const GROUPS_WITH_A_FLAT_FIELD = {
  $or: [
    ...TRANSLATABLE_STRING_FIELDS.map((field) => ({ [field]: { $type: "string" } })),
    // an empty list needs no rewriting, so the first item is what is looked at
    ...TRANSLATABLE_ARRAY_FIELDS.map((field) => ({ [`${field}.0`]: { $type: "string" } })),
  ],
};

/** The skill groups that carry at least one localized translatable value, i.e. the ones up() has rewritten. */
const GROUPS_WITH_A_LOCALIZED_FIELD = {
  $or: [
    ...TRANSLATABLE_STRING_FIELDS.map((field) => ({ [field]: { $type: "object" } })),
    ...TRANSLATABLE_ARRAY_FIELDS.map((field) => ({ [`${field}.0`]: { $type: "object" } })),
  ],
};

/** Wraps a flat value into a localized sub document, leaving an already localized one as it is. */
function wrapField(field: string, dbKeyName: string) {
  return {
    $cond: [
      { $eq: [{ $type: `$${field}` }, "string"] },
      { [dbKeyName]: `$${field}` },
      // already localized, or absent, in which case $set leaves the field alone
      `$${field}`,
    ],
  };
}

/** Wraps every flat item of a list into a localized sub document, leaving already localized items as they are. */
function wrapArrayField(field: string, dbKeyName: string) {
  return {
    $cond: [
      { $isArray: `$${field}` },
      {
        $map: {
          input: `$${field}`,
          as: "item",
          in: {
            $cond: [{ $eq: [{ $type: "$$item" }, "string"] }, { [dbKeyName]: "$$item" }, "$$item"],
          },
        },
      },
      `$${field}`,
    ],
  };
}

/** Flattens a localized sub document back to the value of the language of the model, or to an empty string. */
function unwrapField(field: string, dbKeyName: string) {
  return {
    $cond: [{ $eq: [{ $type: `$${field}` }, "object"] }, { $ifNull: [`$${field}.${dbKeyName}`, ""] }, `$${field}`],
  };
}

/** Flattens every localized item of a list back to the value of the language of the model. */
function unwrapArrayField(field: string, dbKeyName: string) {
  return {
    $cond: [
      { $isArray: `$${field}` },
      {
        $map: {
          input: `$${field}`,
          as: "item",
          in: {
            $cond: [{ $eq: [{ $type: "$$item" }, "object"] }, { $ifNull: [`$$item.${dbKeyName}`, ""] }, "$$item"],
          },
        },
      },
      `$${field}`,
    ],
  };
}

/** Builds the single $set stage that rewrites every translatable field of a group in one pass. */
function buildSetStage(
  dbKeyName: string,
  buildString: (field: string, dbKeyName: string) => object,
  buildArray: (field: string, dbKeyName: string) => object
): Record<string, object> {
  const stage: Record<string, object> = {};
  TRANSLATABLE_STRING_FIELDS.forEach((field) => {
    stage[field] = buildString(field, dbKeyName);
  });
  TRANSLATABLE_ARRAY_FIELDS.forEach((field) => {
    stage[field] = buildArray(field, dbKeyName);
  });
  return stage;
}

/**
 * Reads every model once and returns the ids of the models, grouped by the language their data is in: the first of
 * the languages the model declares, or the fall back language when it declares none, or one that the registry does
 * not know about.
 *
 * Reading every model up front, in a single request, is what keeps the migration from looking a model up per skill
 * group: the groups of all the models that share a language are then rewritten with a single request.
 */
async function getModelIdsByDbKeyName(
  connection: mongoose.Connection
): Promise<Map<string, mongoose.Types.ObjectId[]>> {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  const models = await getModelInfoCollection(connection)
    .find({}, { projection: { availableLanguages: 1 } })
    .toArray();

  const modelIdsByDbKeyName = new Map<string, mongoose.Types.ObjectId[]>();
  for (const model of models) {
    const shortCode = Array.isArray(model.availableLanguages) ? model.availableLanguages[0] : undefined;
    const language =
      typeof shortCode === "string" ? LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode) : undefined;
    const dbKeyName = language?.dbKeyName ?? fallbackDbKeyName;
    const modelIds = modelIdsByDbKeyName.get(dbKeyName) ?? [];
    modelIds.push(model._id);
    modelIdsByDbKeyName.set(dbKeyName, modelIds);
  }
  return modelIdsByDbKeyName;
}

/**
 * Rewrites the translatable fields of the skill groups that match the given filter, one request per language, all of
 * them sent in a single round trip.
 *
 * A group whose model no longer exists is not rewritten, as there is no language to key its values by. Such a group
 * is reported, it is the only thing a run can leave behind.
 */
async function rewriteTranslatableFields(
  connection: mongoose.Connection,
  filter: object,
  buildString: (field: string, dbKeyName: string) => object,
  buildArray: (field: string, dbKeyName: string) => object
): Promise<IMigrationResult> {
  const modelIdsByDbKeyName = await getModelIdsByDbKeyName(connection);
  const collection = getSkillGroupCollection(connection);
  if (modelIdsByDbKeyName.size === 0) {
    return { matched: 0, modified: 0 };
  }

  const result = await collection.bulkWrite(
    [...modelIdsByDbKeyName].map(([dbKeyName, modelIds]) => ({
      updateMany: {
        filter: { modelId: { $in: modelIds }, ...filter },
        update: [{ $set: buildSetStage(dbKeyName, buildString, buildArray) }],
      },
    }))
  );

  const leftBehindCount = await collection.countDocuments(filter);
  if (leftBehindCount > 0) {
    console.warn(`${leftBehindCount} skill group(s) were left untouched, they belong to a model that does not exist.`);
  }
  return { matched: result.matchedCount, modified: result.modifiedCount };
}

const migration: IMigration = {
  name: "0005-skill-groups-localized-fields",
  description:
    "Rewrites preferredLabel, description, scopeNote and altLabels of every skill group into localized sub documents " +
    "keyed by the first language its model declares. Down flattens them back to the value of that language.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    const result = await rewriteTranslatableFields(connection, GROUPS_WITH_A_FLAT_FIELD, wrapField, wrapArrayField);
    console.info(`Wrapped the translatable fields of ${result.modified} skill group(s).`);
    return result;
  },

  async down(connection: mongoose.Connection): Promise<IMigrationResult> {
    // Flattening keeps a single language only: a group that was translated into other languages after the migration
    // ran loses those translations, which is why the runbook asks for a snapshot before a down. A group that carries
    // no value in the language of its model flattens to an empty string, the closest the flat shape can get.
    const result = await rewriteTranslatableFields(
      connection,
      GROUPS_WITH_A_LOCALIZED_FIELD,
      unwrapField,
      unwrapArrayField
    );
    console.info(`Flattened the translatable fields of ${result.modified} skill group(s).`);
    return result;
  },
};

export default migration;
