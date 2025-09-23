import { SchemaObject } from "ajv";
import { _baseOccupationURLParameterWithId } from "./schemas.base";

const SchemaGETDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestByIdParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseOccupationURLParameterWithId)),
  },
  required: ["modelId", "id"],
};

export default SchemaGETDetailRequestParam;
