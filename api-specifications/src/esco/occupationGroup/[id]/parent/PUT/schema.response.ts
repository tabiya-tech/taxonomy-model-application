import { SchemaObject } from "ajv";
import { _baseResponseSchema as OccupationGroupBaseResponseSchema } from "../../../../occupationGroup/_shared/schemas.base";

const SchemaPUTResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupParentResponseSchemaPUT",
  anyOf: [OccupationGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPUTResponse;
