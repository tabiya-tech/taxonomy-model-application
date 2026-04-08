import { SchemaObject } from "ajv";
import { _baseSkillURLParameter } from "../_shared/schemas.base";

const SchemaPOSTRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillRequestParamSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseSkillURLParameter)),
  },
  required: ["modelId"],
};
export default SchemaPOSTRequestParam;
