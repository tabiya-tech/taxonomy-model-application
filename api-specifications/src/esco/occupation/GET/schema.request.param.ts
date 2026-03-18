import { SchemaObject } from "ajv";
import { _baseOccupationURLParameter } from "../_shared/schemas.base";

const SchemaGETRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseOccupationURLParameter,
  },
  required: ["modelId"],
};

export default SchemaGETRequestParam;
