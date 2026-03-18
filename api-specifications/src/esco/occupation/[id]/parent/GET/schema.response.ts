import { SchemaObject } from "ajv";
import { _baseResponseSchema as OccupationBaseResponseSchema } from "../../../_shared/schemas.base";
import { _baseResponseSchema as OccupationGroupBaseResponseSchema } from "../../../../occupationGroup/_shared/schemas.base";

const SchemaGETParentResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETParent",
  anyOf: [OccupationBaseResponseSchema, OccupationGroupBaseResponseSchema, { type: "null" }],
};

export default SchemaGETParentResponse;
