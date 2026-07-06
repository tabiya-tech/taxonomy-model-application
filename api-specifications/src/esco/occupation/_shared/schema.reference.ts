import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../../../regex";
import OccupationConstants from "./constants";
import OccupationEnums from "./enums";

/**
 * The properties of a reference to an occupation — the lightweight shape used when an occupation is shown from
 * the outside (e.g. as it appeared in a model in its history). Exported separately so it can be spread into
 * other schemas as the single source of truth.
 */
export const _occupationReferenceProperties: Record<string, SchemaObject> = {
  id: {
    description: "The id of the occupation.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
  UUID: {
    description: "The UUID of the occupation.",
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
  preferredLabel: {
    description: "The preferred label of the occupation.",
    type: "string",
    maxLength: OccupationConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  occupationGroupCode: {
    description: "The code of the parent occupation group.",
    type: "string",
    maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
  },
  code: {
    description: "The code of the occupation.",
    type: "string",
    maxLength: OccupationConstants.CODE_MAX_LENGTH,
  },
  occupationType: {
    description: "The occupation classification type (e.g., ESCOOccupation or LocalOccupation).",
    type: "string",
    enum: Object.values(OccupationEnums.OccupationType),
  },
  isLocalized: {
    description: "Indicates if the occupation has localized variants. Must be false for LocalOccupation.",
    type: "boolean",
  },
};

/**
 * A standalone, reusable schema for a reference to an occupation.
 */
const SchemaOccupationReference: SchemaObject = {
  $id: "/components/schemas/OccupationReferenceSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_occupationReferenceProperties)), // deep copy the reference properties
  },
  required: ["id", "UUID", "preferredLabel", "occupationGroupCode", "code", "occupationType", "isLocalized"],
};

export default SchemaOccupationReference;
