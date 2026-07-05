import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_UUIDv4 } from "../../../../../regex";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import SkillEnums from "../../../_shared/enums";
import { _baseProperties } from "../../../_shared/schemas.base";

// Reuse the shared skill property definitions for the reference fields, deep-copied once so the history item
// never aliases (and mutates) the originals.
const { preferredLabel, isLocalized } = JSON.parse(JSON.stringify(_baseProperties));

// The history response is an array of "the skill as it appeared in one model" items: the skill's reference
// fields flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference).
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        description: "The id of the skill in this model.",
        type: "string",
        pattern: RegExp_Str_ID,
      },
      UUID: {
        description: "The UUID of the skill in this model.",
        type: "string",
        pattern: RegExp_Str_UUIDv4,
      },
      preferredLabel,
      isLocalized,
      objectType: {
        description: "The type of the entity (skill).",
        type: "string",
        enum: [SkillEnums.ObjectTypes.Skill],
      },
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType", "model"],
  },
};

export default SchemaGETHistoryResponse;
