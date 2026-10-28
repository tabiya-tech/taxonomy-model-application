import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../schemas.base";

// JSON schema of the response body of GET /models/{modelId}.
// It is a deep copy of the shared base response schema
// The $id is the name other schemas and Ajv use to reference it.
const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/ModelInfoResponseSchemaGETDetail",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)),
};
export default SchemaGETResponse;