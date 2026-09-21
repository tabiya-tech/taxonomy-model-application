import mongoose from "mongoose";
import { initializeSchemaAndModel } from "../../src/esco/occupationGroup/model/OccupationGroup.model";
import { MongooseModelName } from "../../src/esco/common/mongooseModelNames";
import { getFallbackLanguageConfig } from "../../src/common/language/fallbackLanguage";
import { IMigration, IMigrationResult } from "./migration.types";

/**
 * Rewrites the translatable fields of every occupation group into localized sub documents.
 *
 * An occupation group that predates the localized schema carries its translatable fields as flat values, in a single
 * language, the fall back language of the environment:
 *
 *   { preferredLabel: "Managers", description: "...", altLabels: ["a", "b"] }
 *
 * becomes
 *
 *   { preferredLabel: { en: "Managers" }, description: { en: "..." }, altLabels: [{ en: "a" }, { en: "b" }] }
 *
 * code and groupType are monolingual and are left untouched, so the code validation that switches on groupType keeps
 * working unchanged.
 */

/** The translatable fields that hold a single value, i.e. one localized sub document each. */
const TRANSLATABLE_STRING_FIELDS = ["preferredLabel", "description"] as const;

/** The translatable fields that hold a list of values, i.e. an array of localized sub documents each. */
const TRANSLATABLE_ARRAY_FIELDS = ["altLabels"] as const;

/**
 * Returns the collection of the occupation groups, taken from the model so that its name is never hardcoded here.
 * The model is registered on the connection only when the connection does not carry it already, as mongoose refuses
 * to compile the same model twice.
 */
function getOccupationGroupCollection(connection: mongoose.Connection): mongoose.Collection {
  const model = connection.models[MongooseModelName.OccupationGroup] ?? initializeSchemaAndModel(connection);
  return model.collection;
}

/**
 * The occupation groups that still carry at least one flat translatable value: a single value that is a string, or a
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

/** The occupation groups that carry at least one localized translatable value, i.e. the ones up() has rewritten. */
const GROUPS_WITH_A_LOCALIZED_FIELD = {
  $or: [
    ...TRANSLATABLE_STRING_FIELDS.map((field) => ({ [field]: { $type: "object" } })),
    ...TRANSLATABLE_ARRAY_FIELDS.map((field) => ({ [`${field}.0`]: { $type: "object" } })),
  ],
};

/** Wraps a flat value into a localized sub document, leaving an already localized one as it is. */
function wrapField(field: string, fallbackDbKeyName: string) {
  return {
    $cond: [
      { $eq: [{ $type: `$${field}` }, "string"] },
      { [fallbackDbKeyName]: `$${field}` },
      // already localized, or absent, in which case $set leaves the field alone
      `$${field}`,
    ],
  };
}

/** Wraps every flat item of a list into a localized sub document, leaving already localized items as they are. */
function wrapArrayField(field: string, fallbackDbKeyName: string) {
  return {
    $cond: [
      { $isArray: `$${field}` },
      {
        $map: {
          input: `$${field}`,
          as: "item",
          in: {
            $cond: [{ $eq: [{ $type: "$$item" }, "string"] }, { [fallbackDbKeyName]: "$$item" }, "$$item"],
          },
        },
      },
      `$${field}`,
    ],
  };
}

/** Flattens a localized sub document back to the value of the fall back language, or to an empty string. */
function unwrapField(field: string, fallbackDbKeyName: string) {
  return {
    $cond: [
      { $eq: [{ $type: `$${field}` }, "object"] },
      { $ifNull: [`$${field}.${fallbackDbKeyName}`, ""] },
      `$${field}`,
    ],
  };
}

/** Flattens every localized item of a list back to the value of the fall back language. */
function unwrapArrayField(field: string, fallbackDbKeyName: string) {
  return {
    $cond: [
      { $isArray: `$${field}` },
      {
        $map: {
          input: `$${field}`,
          as: "item",
          in: {
            $cond: [
              { $eq: [{ $type: "$$item" }, "object"] },
              { $ifNull: [`$$item.${fallbackDbKeyName}`, ""] },
              "$$item",
            ],
          },
        },
      },
      `$${field}`,
    ],
  };
}

/** Builds the single $set stage that rewrites every translatable field of a group in one pass. */
function buildSetStage(
  fallbackDbKeyName: string,
  buildString: (field: string, fallbackDbKeyName: string) => object,
  buildArray: (field: string, fallbackDbKeyName: string) => object
): Record<string, object> {
  const stage: Record<string, object> = {};
  TRANSLATABLE_STRING_FIELDS.forEach((field) => {
    stage[field] = buildString(field, fallbackDbKeyName);
  });
  TRANSLATABLE_ARRAY_FIELDS.forEach((field) => {
    stage[field] = buildArray(field, fallbackDbKeyName);
  });
  return stage;
}

const migration: IMigration = {
  name: "0003-occupation-groups-localized-fields",
  description:
    "Rewrites preferredLabel, description and altLabels of every occupation group into localized sub documents " +
    "keyed by the fall back language. Down flattens them back to the value of the fall back language.",

  async up(connection: mongoose.Connection): Promise<IMigrationResult> {
    const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
    const collection = getOccupationGroupCollection(connection);
    const result = await collection.updateMany(GROUPS_WITH_A_FLAT_FIELD, [
      { $set: buildSetStage(fallbackDbKeyName, wrapField, wrapArrayField) },
    ]);
    console.info(
      `Wrapped the translatable fields of ${result.modifiedCount} occupation group(s) into '${fallbackDbKeyName}'.`
    );
    return { matched: result.matchedCount, modified: result.modifiedCount };
  },

  async down(connection: mongoose.Connection): Promise<IMigrationResult> {
    // Flattening keeps the fall back language only: a group that was translated into other languages after the
    // migration ran loses those translations, which is why the runbook asks for a snapshot before a down. A group
    // that carries no fall back language at all flattens to an empty string, the closest the flat shape can get.
    const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
    const collection = getOccupationGroupCollection(connection);
    const result = await collection.updateMany(GROUPS_WITH_A_LOCALIZED_FIELD, [
      { $set: buildSetStage(fallbackDbKeyName, unwrapField, unwrapArrayField) },
    ]);
    console.info(`Flattened the translatable fields of ${result.modifiedCount} occupation group(s).`);
    return { matched: result.matchedCount, modified: result.modifiedCount };
  },
};

export default migration;
