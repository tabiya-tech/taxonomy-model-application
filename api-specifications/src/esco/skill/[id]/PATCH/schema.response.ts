import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaPATCH",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
};

export default SchemaPATCHResponse;
