import { SchemaObject } from "ajv";
import SkillEnums from "../../../_shared/enums";
import { RegExp_Str_ID } from "../../../../../regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRelatedRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiredSkillId: { type: "string", pattern: RegExp_Str_ID },
    relationType: {
      type: "string",
      enum: Object.values(SkillEnums.SkillToSkillRelationType),
    },
  },
  required: ["requiredSkillId", "relationType"],
};

export default SchemaPOSTRequest;
