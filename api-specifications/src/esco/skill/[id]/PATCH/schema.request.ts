import { SchemaObject } from "ajv";
import { _basePatchRequestProperties } from "../../_shared/schemas.base";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._basePatchRequestProperties,
  },
};

export default SchemaPATCHRequest;
