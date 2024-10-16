import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../regex";
import { ExportProcessState } from "./enums";
import ExportProcessStateConstants from "./constants";

export const baseExportProcessStateProperties = {
  id: {
    description: "The identifier of the specific export state.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
  status: {
    description: "The status of the export process of the model.",
    type: "string",
    enum: Object.values(ExportProcessState.Enums.Status),
  },
  result: {
    description: "The result of the export process of the model. It can be errored, export errors or export warnings.",
    type: "object",
    additionalProperties: false,
    properties: {
      errored: {
        description: "if the export process has completed or it was did not complete due to some unexpected error.",
        type: "boolean",
      },
      exportErrors: {
        description: "if the export encountered errors while export the csv files.",
        type: "boolean",
      },
      exportWarnings: {
        description: "if the export encountered warnings while export the csv files.",
        type: "boolean",
      },
    },
    required: ["errored", "exportErrors", "exportWarnings"],
  },
  downloadUrl: {
    description:
      "The url to download the exported model. It can be empty if the export process is still in running or it has not completed successfully.",
    type: "string",
    anyOf: [
      {
        pattern: "^$", // Allow empty string
      },
      {
        format: "uri",
        pattern: "^https://.*", // accept only https
      },
    ],
    maxLength: ExportProcessStateConstants.MAX_URI_LENGTH,
  },
  timestamp: {
    description: "The timestamp of the export process.",
    type: "string",
    format: "date-time",
  },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

const SchemaGETResponse: SchemaObject = {
  description:
    "The state of the export process of the model. Since the export process is asynchronous, use the status to check if the export process has completed and the result to check if the process encountered any issues",
  $id: "/components/schemas/ExportProcessStateSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseExportProcessStateProperties,
    modelId: {
      description: "The identifier of the model to be exported.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    //Will also have additional properties like stats...
  },
  required: ["id", "modelId", "status", "result", "downloadUrl", "timestamp", "createdAt", "updatedAt"],
};

export default SchemaGETResponse;
