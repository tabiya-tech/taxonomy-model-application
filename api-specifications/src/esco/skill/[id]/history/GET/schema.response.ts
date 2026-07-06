import { SchemaObject } from "ajv";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import { _skillReferenceProperties } from "../../../_shared/schema.reference";

// The history response is an array of "the skill as it appeared in one model" items: the skill's reference fields
// flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference). The flat fields reuse the
// shared skill reference property definitions (deep-copied so this schema never aliases the originals).
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      ...JSON.parse(JSON.stringify(_skillReferenceProperties)), // deep copy the reference properties
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType", "model"],
  },
};

export default SchemaGETHistoryResponse;
