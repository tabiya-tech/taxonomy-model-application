import { SchemaObject } from "ajv";
import { _baseSkillGroupURLParameter } from "./schemas.base";

const SchemaGETRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseSkillGroupURLParameter)),
  },
  required: ["modelId"],
};
export default SchemaGETRequestParam;
