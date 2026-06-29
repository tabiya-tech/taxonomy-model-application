import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPUTResponse: SchemaObject = {
  ..._baseResponseSchema,
  $id: "/components/schemas/OccupationResponseSchemaPUT",
};

export default SchemaPUTResponse;
