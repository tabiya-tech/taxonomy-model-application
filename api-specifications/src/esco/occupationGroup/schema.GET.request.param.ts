import { SchemaObject } from "ajv";
import { _baseOccupationGroupURLParameter } from "./schemas.base";

const SchemaGETRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseOccupationGroupURLParameter)),
  },
  required: ["modelId"],
};

export default SchemaGETRequestParam;
