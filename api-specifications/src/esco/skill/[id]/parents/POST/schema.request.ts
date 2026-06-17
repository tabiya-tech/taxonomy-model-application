import { SchemaObject } from "ajv";
import { ObjectTypes } from "../GET/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillParentsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    parentId: { type: "string", pattern: RegExp_Str_ID },
    parentType: {
      type: "string",
      enum: Object.values(ObjectTypes),
    },
  },
  required: ["parentId", "parentType"],
};

export default SchemaPOSTRequest;
