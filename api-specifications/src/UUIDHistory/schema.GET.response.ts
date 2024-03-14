import UUIDHistoryConstants from "./constants";
import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/UUIHistoryResponseSchemaGET",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      modelId: {
        description: "The identifier of the specific model.",
        type: "string",
        pattern: RegExp_Str_ID,
      },
      UUID: {
        description: "The UUID of the model.",
        type: "string",
        pattern: RegExp_Str_UUIDv4,
      },
      name: {
        description: "The name of the model.",
        type: "string",
        pattern: RegExp_Str_NotEmptyString,
        maxLength: UUIDHistoryConstants.NAME_MAX_LENGTH,
      },
      version: {
        description: "The version of the model.",
        type: "string",
        maxLength: UUIDHistoryConstants.VERSION_MAX_LENGTH,
      },
      localeShortCode: {
        description: "The short code of the locale.",
        type: "string",
        pattern: RegExp_Str_NotEmptyString,
        maxLength: UUIDHistoryConstants.LOCALE_SHORTCODE_MAX_LENGTH,
      },
    },
    required: ["modelId", "UUID", "name", "version", "localeShortCode"],
  },
};

export default SchemaGETResponse;
