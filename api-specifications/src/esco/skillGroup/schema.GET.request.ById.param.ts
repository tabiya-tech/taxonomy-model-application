import { SchemaObject } from "ajv";
import { _detailSkillGroupURLParameter } from "./schemas.base";

const SchemaGETDetailRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestByIdParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_detailSkillGroupURLParameter)),
  },
  required: ["modelId", "id"],
};
export default SchemaGETDetailRequestParam;
