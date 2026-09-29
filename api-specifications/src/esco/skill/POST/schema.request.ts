// src/.../schema.POST.request.ts
import { SchemaObject } from "ajv";
import { _baseRequestProperties } from "../_shared/schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/SkillRequestSchemaPOST",
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

export default SchemaPOSTRequest;
