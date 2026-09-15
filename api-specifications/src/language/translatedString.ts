import { SchemaObject } from "ajv";
import LanguageConstants from "./constants";
import LanguageTypes from "./types";

/**
 * The JSON Schema factories of a translated value.
 *
 * A translated value is keyed by the dbKeyName of a language of the registry, it is not keyed by a locale. The schemas
 * are built from the registry, so that the only keys a payload may carry are the languages the platform knows about,
 * and so that the length limit of a field is enforced for every language on its own.
 */

/**
 * Builds the schema of a translated value, e.g. of a preferredLabel or of a description.
 * @param options the description, the per language maxLength and pattern, and whether the fall back language is required
 * @returns the schema of the translated value, to be used as a property of a larger schema
 */
export function getTranslatedStringSchema(options: LanguageTypes.ITranslatedStringSchemaOptions): SchemaObject {
  const properties: SchemaObject = {};
  LanguageConstants.Languages.forEach((language) => {
    properties[language.dbKeyName] = {
      description: `${options.description} (${language.name})`,
      type: "string",
      maxLength: options.maxLength,
      ...(options.pattern !== undefined ? { pattern: options.pattern } : {}),
    };
  });

  return {
    description: options.description,
    type: "object",
    additionalProperties: false,
    properties,
    ...(options.required ? { required: [LanguageConstants.FALL_BACK_LANGUAGE.dbKeyName] } : {}),
  };
}

/**
 * Builds the schema of a list of translated values, e.g. of the altLabels.
 *
 * Every item requires the fall back language, the option is not left to the caller, because the database requires it
 * of every item as well, see TranslatedStringArrayProperty in the backend. A schema that did not require it would
 * accept a payload that the database then rejects.
 *
 * `uniqueItems` only rejects two items that are identical in every language. The database is stricter, it rejects two
 * items that carry the same value in a single language, e.g. [{ en: "Cook" }, { en: "Cook", fr: "Cuisinier" }]. JSON
 * Schema cannot express uniqueness per key, so the stricter rule stays a database rule: the schema never rejects a
 * payload the database would accept, but it does let a payload through that the database rejects.
 *
 * @param options the options of the translated value of a single item, plus the maximum number of items
 * @returns the schema of the list of translated values, to be used as a property of a larger schema
 */
export function getTranslatedStringArraySchema(
  options: LanguageTypes.ITranslatedStringArraySchemaOptions
): SchemaObject {
  return {
    description: options.description,
    type: "array",
    minItems: 0,
    maxItems: options.maxItems,
    uniqueItems: true,
    items: getTranslatedStringSchema({ ...options, required: true }),
  };
}
