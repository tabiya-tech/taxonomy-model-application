import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../../../regex";
import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";

/**
 * The properties of a reference to an occupation group — the lightweight shape used when an occupation group is
 * shown from the outside (e.g. as it appeared in a model in its history). Exported separately so it can be spread
 * into other schemas as the single source of truth.
 */
export const _occupationGroupReferenceProperties: Record<string, SchemaObject> = {
  id: {
    description: "The id of the occupation group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
  UUID: {
    description: "The UUID of the occupation group.",
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
  code: {
    description: "The code of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
  },
  preferredLabel: {
    description: "The preferred label of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  objectType: {
    description: "The type of the occupation group.",
    type: "string",
    enum: Object.values(OccupationGroupEnums.ObjectTypes),
  },
};

/**
 * A standalone, reusable schema for a reference to an occupation group.
 */
const SchemaOccupationGroupReference: SchemaObject = {
  $id: "/components/schemas/OccupationGroupReferenceSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_occupationGroupReferenceProperties)), // deep copy the reference properties
  },
  required: ["id", "UUID", "code", "preferredLabel", "objectType"],
};

export default SchemaOccupationGroupReference;
