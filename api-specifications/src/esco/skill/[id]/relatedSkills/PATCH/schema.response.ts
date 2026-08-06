import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../_shared/schemas.base";
import SkillEnums from "../../../_shared/enums";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/SkillRelatedResponseSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...SkillBaseResponseSchema.properties,
    relationType: {
      description: "The type of relationship between skills.",
      type: "string",
      enum: Object.values(SkillEnums.SkillToSkillRelationType),
    },
  },
  required: [...SkillBaseResponseSchema.required, "relationType"],
};

export default SchemaPATCHResponse;
