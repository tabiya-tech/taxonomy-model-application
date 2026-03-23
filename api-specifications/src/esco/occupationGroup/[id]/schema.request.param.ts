import { SchemaObject } from "ajv";
import { _detailOccupationGroupURLParameter } from "../_shared/schemas.base";

const SchemaGETDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestByIdParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_detailOccupationGroupURLParameter)),
  },
  required: ["modelId", "id"],
};

export default SchemaGETDetailRequestParam;
