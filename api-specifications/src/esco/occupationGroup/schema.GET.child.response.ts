import { SchemaObject } from "ajv";
import { _baseChildrenResponseSchema } from "./schemas.base";

const SchemaGETChildResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupChildResponseSchemaGET",
  ...JSON.parse(JSON.stringify(_baseChildrenResponseSchema)), // deep copy the base properties
};

export default SchemaGETChildResponse;
