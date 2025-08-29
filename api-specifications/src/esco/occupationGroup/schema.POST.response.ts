import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaPOST",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};

export default SchemaPOSTResponse;
