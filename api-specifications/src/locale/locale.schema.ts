import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4} from "../regex";
import {ModelInfoConstants} from "../modelInfo/modelInfo.constants";

const LocaleSchema: SchemaObject = {
  $id: "/components/schemas/LocaleSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    UUID: {
      description: "The UUID of the locale",
      type: "string",
      pattern: RegExp_Str_UUIDv4
    },
    shortCode: {
      description: "The short code of the locale",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: ModelInfoConstants.LOCALE_SHORTCODE_MAX_LENGTH
    },
    name: {
      description: "The name of the locale",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: ModelInfoConstants.NAME_MAX_LENGTH
    }
  },
  required: [
    "UUID",
    "shortCode",
    "name"
  ]
};

export default LocaleSchema;