import { SchemaObject } from "ajv";
import { _baseResponseSchema as ModelInfoBaseResponseSchema } from "../../../../../modelInfo/schemas.base";

// The history response is an array of full ModelInfo GET objects, one per model the skill appeared in.
// It mirrors the ModelInfo GET response shape (see modelInfo/schema.GET.response.ts) with a distinct $id.
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaGETHistory",
  type: "array",
  items: {
    ...JSON.parse(JSON.stringify(ModelInfoBaseResponseSchema)), // deep copy the base properties
  },
};

export default SchemaGETHistoryResponse;
