import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../_shared/schemas.base";

const SchemaGETResponseDetail: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGETDetail",
  ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
};

export default SchemaGETResponseDetail;
