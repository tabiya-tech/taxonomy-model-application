import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../_shared/schemas.base";
import { _baseResponseSchema as SkillGroupBaseResponseSchema } from "../../../../skillGroup/_shared/schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/SkillParentsResponseSchemaPOST",
  anyOf: [SkillBaseResponseSchema, SkillGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPOSTResponse;
