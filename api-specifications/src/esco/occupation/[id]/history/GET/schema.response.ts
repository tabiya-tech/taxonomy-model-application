import { SchemaObject } from "ajv";
import { _baseResponseSchema as ModelInfoBaseResponseSchema } from "../../../../../modelInfo/schemas.base";

// The history response is an array of full ModelInfo GET objects, one per resolvable UUID
// in the occupation's UUIDHistory. It mirrors the ModelInfo GET response shape (see
// modelInfo/schema.GET.response.ts) but with a distinct $id so it can be registered
// alongside it.
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETHistory",
  type: "array",
  items: {
    ...JSON.parse(JSON.stringify(ModelInfoBaseResponseSchema)), // deep copy the base properties
  },
};

export default SchemaGETHistoryResponse;
