import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../regex";
import { ExportProcessState } from "./enums";

const SchemaGETResponse: SchemaObject = {
  description:
    "The state of the import process of the model. Since the import process is asynchronous, use the status to check if the import process has completed and the result to check if the process encountered any issues",
  $id: "/components/schemas/ExportProcessStateSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The identifier of the specific export state.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    modelId: {
      description: "The identifier of the model to be exported.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    status: {
      description: "The status of the export process of the model.",
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
      description: "The url to download the exported model.",
      type: "string",
      format: "uri",
      pattern: "^https://",
    },
    timestamp: {
      description: "The timestamp of the export process.",
      type: "string",
      format: "date-time",
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    //Will also have additional properties like stats...
  },
  required: ["id", "modelId", "status", "result", "downloadUrl", "timestamp", "createdAt", "updatedAt"],
};

export default SchemaGETResponse;
