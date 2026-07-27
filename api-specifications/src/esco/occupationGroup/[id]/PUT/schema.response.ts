import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaPUTResponse: SchemaObject = {
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
  $id: "/components/schemas/OccupationGroupResponseSchemaPUT",
};

export default SchemaPUTResponse;
