import { SchemaObject } from "ajv";
import { _baseProperties } from "../../_shared/schemas.base";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
};

export default SchemaPATCHRequest;
