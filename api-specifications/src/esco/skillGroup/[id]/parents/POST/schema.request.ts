import { SchemaObject } from "ajv";
import SkillGroupEnums from "../../../_shared/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillGroupParentsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    parentId: { type: "string", pattern: RegExp_Str_ID },
    parentType: {
      type: "string",
      enum: Object.values(SkillGroupEnums.Relations.Parents.ObjectTypes),
    },
  },
  required: ["parentId", "parentType"],
};

export default SchemaPOSTRequest;
