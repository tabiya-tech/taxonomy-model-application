import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_UUIDv4 } from "../../../../../regex";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import SkillGroupEnums from "../../../_shared/enums";
import { _baseProperties } from "../../../_shared/schemas.base";

// Reuse the shared skill group property definitions for the reference fields, deep-copied once so the history
// item never aliases (and mutates) the originals.
const { code, preferredLabel } = JSON.parse(JSON.stringify(_baseProperties));

// The history response is an array of "the skill group as it appeared in one model" items: the group's reference
// fields flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference).
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/SkillGroupResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        description: "The id of the skill group in this model.",
        type: "string",
        pattern: RegExp_Str_ID,
      },
      UUID: {
        description: "The UUID of the skill group in this model.",
        type: "string",
        pattern: RegExp_Str_UUIDv4,
      },
      code,
      preferredLabel,
      objectType: {
        description: "The type of the entity (skill group).",
        type: "string",
        enum: [SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup],
      },
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "code", "preferredLabel", "objectType", "model"],
  },
};

export default SchemaGETHistoryResponse;
