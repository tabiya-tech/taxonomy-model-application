import { SchemaObject } from "ajv";
import LanguageConstants from "./constants";
import LanguageTypes from "./types";

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
    ...(options.required ? { required: [LanguageConstants.FALLBACK_LANGUAGE.dbKeyName] } : {}),
  };
}

/**
 * Builds the schema of a list of translated values, e.g. of the altLabels.
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
