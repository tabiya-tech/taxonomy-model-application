import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";
import ModelInfoConstants from "./constants";
import Locale from "../locale";
import LocaleConstants from "../locale/constants";
import { baseImportProcessStateProperties } from "../importProcessState/schema.GET.response";
import { baseExportProcessStateProperties } from "../exportProcessState/schema.GET.response";

/**
 *  The base schema for the model info request
 *  This is a workaround the fact that ajv does truly not support inheritance
 *  Using schema composition with allOf does not work as the additionalProperties = false
 *  and the suggested solution with unevaluatedProperties = false does not work either
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  name: {
    description: "The name of the model",
    type: "string",
    pattern: RegExp_Str_NotEmptyString,
    maxLength: ModelInfoConstants.NAME_MAX_LENGTH,
  },
  description: {
    description: "The description of the model",
    type: "string",
    maxLength: ModelInfoConstants.DESCRIPTION_MAX_LENGTH,
  },
  locale: {
    $ref: `${Locale.Schemas.Payload.$id}`,
  },
  UUIDHistory: {
    description: "The UUIDs history of the model.",
    type: "array",
    minItems: 0,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
  },
};

export const _baseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The id of the model. It can be used to retrieve the model from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the model. It can be used to identify the model across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    path: {
      description: "The path to the model resource using the resource id",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: ModelInfoConstants.MAX_URI_LENGTH,
    },
    tabiyaPath: {
      description: "The path to the model resource using the resource UUID",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: ModelInfoConstants.MAX_URI_LENGTH,
    },
    released: {
      description: "Whether the model is released or not",
      type: "boolean",
    },
    releaseNotes: {
      description: "The release notes of the model",
      type: "string",
      maxLength: ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH,
    },
    version: {
      description: "The version of the model. It should follow the conventions of semantic versioning.",
      type: "string",
      maxLength: ModelInfoConstants.VERSION_MAX_LENGTH,
    },
    exportProcessState: {
      description: "The export process state of the model.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: { ...JSON.parse(JSON.stringify(baseExportProcessStateProperties)) }, // deep copy the base exportProcessState properties
        required: ["id", "status", "downloadUrl", "timestamp", "result", "createdAt", "updatedAt"],
      },
    },
    importProcessState: {
      description: "The import process state of the model.",
      type: "object",
      additionalProperties: false,
      properties: {
        ...JSON.parse(JSON.stringify(baseImportProcessStateProperties)),
      }, // deep copy the base importProcessState properties
      required: ["id", "status", "result"],
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties
    UUIDHistory: {
      description: "The UUIDs history of the model.",
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
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
            maxLength: ModelInfoConstants.NAME_MAX_LENGTH,
          },
          version: {
            description: "The version of the model.",
            type: "string",
            maxLength: ModelInfoConstants.VERSION_MAX_LENGTH,
          },
          localeShortCode: {
            description: "The short code of the locale",
            type: "string",
            pattern: RegExp_Str_NotEmptyString,
            maxLength: LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH,
          },
        },
        required: ["id", "UUID", "name", "version", "localeShortCode"],
      },
    },
  },
  required: [
    "name",
    "description",
    "locale",
    "id",
    "UUID",
    "path",
    "tabiyaPath",
    "released",
    "releaseNotes",
    "version",
    "exportProcessState",
    "importProcessState",
    "createdAt",
    "updatedAt",
    "UUIDHistory",
  ],
};
