import { SchemaObject } from "ajv";
import { _baseOccupationURLParameterWithId } from "../../_shared/schemas.base";

const SchemaDELETEDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestByIdParamSchemaDELETE",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseOccupationURLParameterWithId,
  },
  required: ["modelId", "id"],
};

export default SchemaDELETEDetailRequestParam;
