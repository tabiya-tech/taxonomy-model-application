import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../regex";
import LanguageConstants from "./constants";

const LanguageConfigSchema: SchemaObject = {
  $id: "/components/schemas/LanguageConfigSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      description: "The human readable name of the language",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: LanguageConstants.NAME_MAX_LENGTH,
    },
    shortCode: {
      description: "The short code of the language, the value the client sends in the Accept-Language header",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: LanguageConstants.SHORT_CODE_MAX_LENGTH,
    },
    dbKeyName: {
      description: "The key of the language inside a localized sub-document",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: LanguageConstants.DB_KEY_NAME_MAX_LENGTH,
    },
    csvSuffix: {
      description: "The suffix of the CSV columns that carry this language",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: LanguageConstants.CSV_SUFFIX_MAX_LENGTH,
    },
  },
  required: ["name", "shortCode", "dbKeyName", "csvSuffix"],
};

export default LanguageConfigSchema;
