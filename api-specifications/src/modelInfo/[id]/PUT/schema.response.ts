import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../schemas.base";

const SchemaPUTResponse: SchemaObject = {
  $id: "/components/schemas/ModelInfoResponseSchemaPUT",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
};

export default SchemaPUTResponse;
