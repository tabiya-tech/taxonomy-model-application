import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";
import ModelInfoConstants from "./constants";
import Locale from "../locale";
import ImportProcessState from "../importProcessState";
import ExportProcessState from "../exportProcessState";

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
      pattern: RegExp_Str_NotEmptyString,
    },
    tabiyaPath: {
      description: "The path to the model resource using the resource UUID",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
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
        properties: {
          id: {
            description: "The identifier of the specific export state.",
            type: "string",
            pattern: RegExp_Str_ID,
          },
          status: {
            description: "The status of the export of the model.",
            type: "string",
            enum: Object.values(ExportProcessState.Enums.Status),
          },
          result: {
            description:
              "The result of the export process of the model. It can be errored, export errors or export warnings.",
            type: "object",
            additionalProperties: false,
            properties: {
              errored: {
                description:
                  "if the export process has completed or it was did not complete due to some unexpected error.",
                type: "boolean",
              },
              exportErrors: {
                description: "if the export encountered errors while processing the data and generating the csv files.",
                type: "boolean",
              },
              exportWarnings: {
                description: "if the export encountered warnings while exporting the data.",
                type: "boolean",
              },
            },
            required: ["errored", "exportErrors", "exportWarnings"],
          },
          downloadUrl: {
            description: "The url to download the exported model.",
            type: "string",
            pattern: "^$|^https?://.*",
          },
          timestamp: {
            description: "The timestamp of the export process.",
            type: "string",
            format: "date-time",
          },
        },
        required: ["id", "status", "downloadUrl", "timestamp", "result"],
      },
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
          enum: Object.values(ImportProcessState.Enums.Status),
        },
        result: {
          description:
            "The result of the import process of the model. It can be errored, parsing errors or parsing warnings.",
          type: "object",
          additionalProperties: false,
          properties: {
            errored: {
              description:
                "if the import process has completed or it was did not complete due to some unexpected error.",
              type: "boolean",
            },
            parsingErrors: {
              description: "if the import encountered errors while parsing the csv files.",
              type: "boolean",
            },
            parsingWarnings: {
              description: "if the import encountered warnings while parsing the csv files.",
              type: "boolean",
            },
          },
          required: ["errored", "parsingErrors", "parsingWarnings"],
        },
      },
      required: ["id", "status", "result"],
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties
    UUIDHistory: {
      ..._baseProperties.UUIDHistory,
      minItems: 1,
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
