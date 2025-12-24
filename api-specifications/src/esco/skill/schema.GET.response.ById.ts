import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";

const SchemaGETResponseById: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaGETById",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};
export default SchemaGETResponseById;
