import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../schemas.base";
import { _baseResponseSchema as SkillGroupBaseResponseSchema } from "../../../skillGroup/schemas.base";

const SchemaGETParentResponse: SchemaObject = {
  $id: "/components/schemas/SkillParentResponseSchemaGET",
  anyOf: [SkillBaseResponseSchema, SkillGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaGETParentResponse;
