import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../regex";
import { ImportProcessState } from "./enums";

export const baseImportProcessStateProperties = {
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
      },
    },
    required: ["errored", "parsingErrors", "parsingWarnings"],
  },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

const SchemaGETResponse: SchemaObject = {
  description:
    "The state of the import process of the model. Since the import process is asynchronous, use the status to check if the import process has completed and the result to check if the process encountered any issues",
  $id: "/components/schemas/ImportProcessStateSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseImportProcessStateProperties,
    modelId: {
      description: "The identifier of the model for importing the files to.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    //Will also have additional properties like stats...
  },
  required: ["id", "modelId", "status", "result", "createdAt", "updatedAt"],
};

export default SchemaGETResponse;
