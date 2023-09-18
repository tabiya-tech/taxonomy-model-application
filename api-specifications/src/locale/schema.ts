import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4} from "../regex";
import LocaleConstants from "./constants";

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
      maxLength: LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH
    },
    name: {
      description: "The name of the locale",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: LocaleConstants.NAME_MAX_LENGTH
    }
  },
  required: [
    "UUID",
    "shortCode",
    "name"
  ]
};

export default LocaleSchema;