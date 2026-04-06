import { SchemaObject } from "ajv";
import { _baseSkillGroupURLParameter } from "../_shared/schemas.base";

const SchemaPOSTRequestParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestParamSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseSkillGroupURLParameter)),
  },
  required: ["modelId"],
};
export default SchemaPOSTRequestParam;
