import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  ..._baseResponseSchema,
  $id: "/components/schemas/OccupationResponseSchemaPATCH",
};

export default SchemaPATCHResponse;
