import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../../_shared/schemas.base";

const SchemaGETOccupationGroupParentResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupParentResponseSchemaGET",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};
export default SchemaGETOccupationGroupParentResponse;
