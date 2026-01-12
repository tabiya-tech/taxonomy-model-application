import { SchemaObject } from "ajv";
import { _baseOccupationURLParameterWithId } from "./schemas.base";

const SchemaGETDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestByIdParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseOccupationURLParameterWithId,
  },
  required: ["modelId", "id"],
};

export default SchemaGETDetailRequestParam;
