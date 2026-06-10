import { SchemaObject } from "ajv";
import { _baseResponseSchema as OccupationGroupBaseResponseSchema } from "../../../../occupationGroup/_shared/schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/OccupationParentResponseSchemaPOST",
  anyOf: [OccupationGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPOSTResponse;
