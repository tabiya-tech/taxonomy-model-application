import { SchemaObject } from "ajv";
import SkillEnums from "../../../_shared/enums";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRelatedRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    requiredSkillId: { type: "string", minLength: 24, maxLength: 24 },
    relationType: {
      type: "string",
      enum: Object.values(SkillEnums.SkillToSkillRelationType),
    },
  },
  required: ["requiredSkillId", "relationType"],
};

export default SchemaPOSTRequest;
