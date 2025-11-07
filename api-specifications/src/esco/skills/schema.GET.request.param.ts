import { SchemaObject } from "ajv";
import { _baseSkillURLParameter } from "./schemas.base";

const SchemaGETRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillRequestParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseSkillURLParameter)),
  },
  required: ["modelId"],
};

export default SchemaGETRequestParam;
