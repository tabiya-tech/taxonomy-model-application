import { SchemaObject } from "ajv";
import { ObjectTypes } from "../GET/enums";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillParentsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    parentId: { type: "string", minLength: 24, maxLength: 24 },
    parentType: {
      type: "string",
      enum: Object.values(ObjectTypes),
    },
  },
  required: ["parentId", "parentType"],
};

export default SchemaPOSTRequest;
