import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../../../regex";
import SkillConstants from "./constants";
import SkillEnums from "./enums";

/**
 * The properties of a reference to a skill — the lightweight shape used when a skill is shown from the outside
 * (e.g. as it appeared in a model in its history). Exported separately so it can be spread into other schemas as
 * the single source of truth.
 */
export const _skillReferenceProperties: Record<string, SchemaObject> = {
  id: {
    description: "The id of the skill.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
  UUID: {
    description: "The UUID of the skill.",
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
  preferredLabel: {
    description: "The preferred label of the skill.",
    type: "string",
    maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  isLocalized: {
    description: "Indicates if the skill has localized variants.",
    type: "boolean",
  },
  objectType: {
    description: "The type of the entity (skill).",
    type: "string",
    enum: [SkillEnums.ObjectTypes.Skill],
  },
};

/**
 * A standalone, reusable schema for a reference to a skill.
 */
const SchemaSkillReference: SchemaObject = {
  $id: "/components/schemas/SkillReferenceSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_skillReferenceProperties)), // deep copy the reference properties
  },
  required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType"],
};

export default SchemaSkillReference;
