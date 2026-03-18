import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../_shared/schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  ..._baseResponseSchema,
  $id: "/components/schemas/OccupationResponseSchemaPOST",
};

export default SchemaPOSTResponse;
