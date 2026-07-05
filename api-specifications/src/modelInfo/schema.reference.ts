import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";
import ModelInfoConstants from "./constants";
import LocaleConstants from "../locale/constants";

/**
 * The properties of a lightweight reference to a model. This is the stripped-down shape used wherever we only
 * need to identify/show a model (e.g. an entity's model history, or a model's own modelHistory) rather than the
 * full model info. Exported separately so it can be spread into other schemas as the single source of truth.
 */
export const _modelInfoReferenceProperties: Record<string, SchemaObject> = {
  id: {
    description: "The identifier of the specific model.",
    type: ["string", "null"],
    pattern: RegExp_Str_ID,
  },
  UUID: {
    description: "The UUID of the model.",
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
  name: {
    description: "The name of the model.",
    type: ["string", "null"],
    pattern: RegExp_Str_NotEmptyString,
    maxLength: ModelInfoConstants.NAME_MAX_LENGTH,
  },
  version: {
    description: "The version of the model.",
    type: ["string", "null"],
    maxLength: ModelInfoConstants.VERSION_MAX_LENGTH,
  },
  localeShortCode: {
    description: "The short code of the locale",
    type: ["string", "null"],
    pattern: RegExp_Str_NotEmptyString,
    maxLength: LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH,
  },
};

/**
 * A standalone, reusable schema for a lightweight model reference.
 */
const SchemaModelInfoReference: SchemaObject = {
  $id: "/components/schemas/ModelInfoReferenceSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_modelInfoReferenceProperties)), // deep copy the base properties
  },
  required: ["id", "UUID", "name", "version", "localeShortCode"],
};

export default SchemaModelInfoReference;
