import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../../../regex";
import SkillGroupConstants from "./constants";
import SkillGroupEnums from "./enums";
import SkillGroupRegexes from "./regex";

/**
 * The properties of a reference to a skill group — the lightweight shape used when a skill group is shown from
 * the outside (e.g. as it appeared in a model in its history). Exported separately so it can be spread into other
 * schemas as the single source of truth.
 */
export const _skillGroupReferenceProperties: Record<string, SchemaObject> = {
  id: {
    description: "The id of the skill group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
  UUID: {
    description: "The UUID of the skill group.",
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
  code: {
    description: "The code of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
    pattern: SkillGroupRegexes.Str.SKILL_GROUP_CODE,
  },
  preferredLabel: {
    description: "The preferred label of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  objectType: {
    description: "The type of the entity (skill group).",
    type: "string",
    enum: [SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup],
  },
};

/**
 * A standalone, reusable schema for a reference to a skill group.
 */
const SchemaSkillGroupReference: SchemaObject = {
  $id: "/components/schemas/SkillGroupReferenceSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_skillGroupReferenceProperties)), // deep copy the reference properties
  },
  required: ["id", "UUID", "code", "preferredLabel", "objectType"],
};

export default SchemaSkillGroupReference;
