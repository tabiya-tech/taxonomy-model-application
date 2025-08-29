import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGET",
  type: "array",
  items: {
    ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base response properties of OccupationGroup
  },
};

export default SchemaGETResponse;
