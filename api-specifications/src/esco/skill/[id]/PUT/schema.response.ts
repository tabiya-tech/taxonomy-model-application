import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPUTResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaPUT",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
};

export default SchemaPUTResponse;
