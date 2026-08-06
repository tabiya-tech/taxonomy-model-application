import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../_shared/schemas.base";
import { _baseResponseSchema as SkillGroupBaseResponseSchema } from "../../../../skillGroup/_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/SkillParentsResponseSchemaPATCH",
  anyOf: [SkillBaseResponseSchema, SkillGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPATCHResponse;
