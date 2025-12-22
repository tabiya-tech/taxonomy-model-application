import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";

const SchemaGETParentResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupParentResponseSchemaGET",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};
export default SchemaGETParentResponse;
