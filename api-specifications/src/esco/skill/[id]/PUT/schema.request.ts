import { SchemaObject } from "ajv";
import { _baseRequestProperties } from "../../_shared/schemas.base";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseRequestProperties,
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
