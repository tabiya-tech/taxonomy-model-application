import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../regex";

export const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/ExportRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The identifier of the model to be exported.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
  },
  required: ["modelId"],
};

export default SchemaPOSTRequest;
