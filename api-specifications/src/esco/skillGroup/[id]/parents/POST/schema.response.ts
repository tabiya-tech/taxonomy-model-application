import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillGroupBaseResponseSchema } from "../../../_shared/schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/SkillGroupParentResponseSchemaPOST",
  anyOf: [SkillGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPOSTResponse;
