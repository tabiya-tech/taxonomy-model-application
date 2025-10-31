import { SchemaObject } from "ajv";
import { _baseSkillURLParameterWithId } from "./schemas.base";

const SchemaGETDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillRequestByIdParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseSkillURLParameterWithId)),
  },
  required: ["modelId", "id"],
};

export default SchemaGETDetailRequestParam;
