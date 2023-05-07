import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4} from "../regex";
import {NAME_MAX_LENGTH, LOCALE_SHORTCODE_MAX_LENGTH} from "./modelInfo.constants";

export interface ILocale {
  UUID: string
  shortCode: string
  name: string
}

export const LocaleSchema: SchemaObject = {
  $id: "/components/schemas/localeSchema",
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
      maxLength: LOCALE_SHORTCODE_MAX_LENGTH
    },
    name: {
      description: "The name of the locale",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: NAME_MAX_LENGTH
    }
  },
  required: [
    "UUID",
    "shortCode",
    "name"
  ]
};