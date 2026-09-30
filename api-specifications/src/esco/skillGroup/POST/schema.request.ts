import { SchemaObject } from "ajv";
import { _baseRequestProperties } from "../_shared/schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseRequestProperties,
  },
  required: ["preferredLabel", "originUri", "UUIDHistory", "code", "description", "altLabels", "modelId", "scopeNote"],
};

export default SchemaPOSTRequest;
