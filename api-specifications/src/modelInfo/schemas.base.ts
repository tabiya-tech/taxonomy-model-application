import {RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_UUIDv4_Or_Empty} from "../regex";
import {ModelInfoConstants} from "./modelInfo.constants";
import Locale from "../locale";
import ImportProcessState from "../importProcessState";

/**
 *  The base schema for the model info request
 *  This is a workaround the fact that ajv does truly not support inheritance
 *  Using schema composition with allOf does not work as the additionalProperties = fasle
 *  and the suggested solution with unevaluatedProperties = false does not work either
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  name: {
    description: "The name of the model",
    type: "string",
    pattern: RegExp_Str_NotEmptyString,
    maxLength: ModelInfoConstants.NAME_MAX_LENGTH
  },
  description: {
    description: "The description of the model",
    type: "string",
    maxLength: ModelInfoConstants.DESCRIPTION_MAX_LENGTH
  },
  locale: {
    $ref: `${Locale.Schema.$id}`
  }
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
      pattern: RegExp_Str_UUIDv4
    },
    originUUID: {
      description: "The UUID of the model this model originated from.",
      type: "string",
      pattern: RegExp_Str_UUIDv4_Or_Empty
    },
    previousUUID: {
      description: "The UUID of the previous version this model.",
      type: "string",
      pattern: RegExp_Str_UUIDv4_Or_Empty
    },
    path: {
      description: "The path to the model resource using the resource id",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    tabiyaPath: {
      description: "The path to the model resource using the resource UUID",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    released: {
      description: "Whether the model is released or not",
      type: "boolean"
    },
    releaseNotes: {
      description: "The release notes of the model",
      type: "string",
      maxLength: ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH
    },
    version: {
      description: "The version of the model. It should follow the conventions of semantic versioning.",
      type: "string",
      maxLength: ModelInfoConstants.VERSION_MAX_LENGTH
    },
    importProcessState: {
      description: "The import process state of the model.",
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          description: "The identifier of the specific import state.",
          type: "string",
          pattern: RegExp_Str_ID,
        },
        status: {
          description: "The status of the import process of the model.",
          type: "string",
          enum: Object.values(ImportProcessState.Enums.Status)
        },
        result: {
          description: "The result of the import process of the model. It can be errored, parsing errors or parsing warnings.",
          type: "object",
          additionalProperties: false,
          properties: {
            errored: {
              description: "if the import process has completed or it was did not complete due to some unexpected error.",
              type: "boolean",
            },
            parsingErrors: {
              description: "if the import encountered errors while parsing the csv files.",
              type: "boolean",
            },
            parsingWarnings: {
              description: "if the import encountered warnings while parsing the csv files.",
              type: "boolean",
            }
          },
          required: ["errored", "parsingErrors", "parsingWarnings"]
        }
      },
      required: ["id", "status", "result"]
    },
    createdAt: {type: "string", format: "date-time"},
    updatedAt: {type: "string", format: "date-time"},
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties
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
    "importProcessState",
    "createdAt",
    "updatedAt",
  ]
};