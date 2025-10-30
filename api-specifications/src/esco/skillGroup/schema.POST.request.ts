import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["preferredLabel", "originUri", "UUIDHistory", "code", "description", "altLabels", "modelId", "scopeNote"],
};

export default SchemaPOSTRequest;
