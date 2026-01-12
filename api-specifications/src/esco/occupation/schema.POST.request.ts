// src/.../schema.POST.request.ts
import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";
import OccupationEnums from "./enums";
import OccupationRegexes from "./regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseProperties,
  },
  if: {
    properties: {
      occupationType: { const: OccupationEnums.OccupationType.ESCOOccupation },
    },
  },
  then: {
    properties: {
      code: { type: "string", maxLength: 100, pattern: OccupationRegexes.Str.ESCO_OCCUPATION_CODE },
      occupationGroupCode: { type: "string", maxLength: 100, pattern: OccupationRegexes.Str.ISCO_GROUP_CODE },
    },
  },
  else: {
    properties: {
      code: { type: "string", maxLength: 100, pattern: OccupationRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE },
      occupationGroupCode: { type: "string", maxLength: 100, pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE },
    },
  },

  required: [
    "code",
    "occupationGroupCode",
    "preferredLabel",
    "originUri",
    "UUIDHistory",
    "altLabels",
    "definition",
    "description",
    "regulatedProfessionNote",
    "scopeNote",
    "modelId",
    "occupationType",
    "isLocalized",
  ],
};

export default SchemaPOSTRequest;
