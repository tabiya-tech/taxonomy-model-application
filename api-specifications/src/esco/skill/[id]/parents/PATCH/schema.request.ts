import { SchemaObject } from "ajv";
import { ObjectTypes } from "../GET/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/SkillParentsRequestSchemaPATCH",
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

export default SchemaPATCHRequest;
