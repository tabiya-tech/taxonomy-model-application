import { SchemaObject } from "ajv";
import { _detailOccupationGroupURLParameter } from "../../_shared/schemas.base";

const SchemaDELETEDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestByIdParamSchemaDELETE",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_detailOccupationGroupURLParameter)),
  },
  required: ["modelId", "id"],
};

export default SchemaDELETEDetailRequestParam;
