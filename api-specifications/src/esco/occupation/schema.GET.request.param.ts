import { SchemaObject } from "ajv";
import { _baseOccupationURLParameter } from "./schemas.base";

const SchemaGETRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseOccupationURLParameter)),
  },
  required: ["modelId"],
};

export default SchemaGETRequestParam;
