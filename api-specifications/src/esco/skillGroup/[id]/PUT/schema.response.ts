import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPUTResponse: SchemaObject = {
  $id: "/components/schemas/SkillGroupResponseSchemaPUT",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};

export default SchemaPUTResponse;
