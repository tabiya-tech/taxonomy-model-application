import { SchemaObject } from "ajv";
import { _baseOccupationURLParameterWithId } from "../../_shared/schemas.base";

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
