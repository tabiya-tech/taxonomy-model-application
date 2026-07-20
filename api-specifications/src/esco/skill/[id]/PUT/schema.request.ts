import { SchemaObject } from "ajv";
import { _baseProperties } from "../../_shared/schemas.base";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: [
    "preferredLabel",
    "originUri",
    "UUIDHistory",
    "altLabels",
    "definition",
    "description",
    "scopeNote",
    "modelId",
    "skillType",
    "reuseLevel",
    "isLocalized",
  ],
};

export default SchemaPUTRequest;
