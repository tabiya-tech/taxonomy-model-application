import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../regex";

const SchemaGETRequest: SchemaObject = {
  $id: "/components/schemas/UUIDHistoryRequestSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The identifier of the specific model.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
  },
  required: ["modelId"],
};

export default SchemaGETRequest;
