import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/ModelInfoResponseSchemaPATCH",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};

export default SchemaPATCHResponse;
