import { SchemaObject } from "ajv";
import { _baseResponseSchema as OccupationGroupBaseResponseSchema } from "../../../../occupationGroup/_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupParentResponseSchemaPATCH",
  anyOf: [OccupationGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaPATCHResponse;
