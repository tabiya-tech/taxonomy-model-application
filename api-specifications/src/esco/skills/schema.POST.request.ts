// src/.../schema.POST.request.ts
import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPOST",
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

export default SchemaPOSTRequest;
