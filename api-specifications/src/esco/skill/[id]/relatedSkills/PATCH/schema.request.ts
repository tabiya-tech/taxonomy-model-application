import { SchemaObject } from "ajv";
import SkillEnums from "../../../_shared/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/SkillRelatedRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    requiredSkillId: { type: "string", pattern: RegExp_Str_ID },
    relationType: {
      type: "string",
      enum: Object.values(SkillEnums.SkillToSkillRelationType),
    },
  },
  required: ["requiredSkillId"],
};

export default SchemaPATCHRequest;
