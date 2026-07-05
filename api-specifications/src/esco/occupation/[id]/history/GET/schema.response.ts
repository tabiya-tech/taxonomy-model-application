import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_UUIDv4 } from "../../../../../regex";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import { _baseProperties } from "../../../_shared/schemas.base";

// Reuse the shared occupation property definitions for the reference fields, deep-copied once so the history
// item never aliases (and mutates) the originals.
const { preferredLabel, occupationGroupCode, code, occupationType, isLocalized } = JSON.parse(
  JSON.stringify(_baseProperties)
);

// The history response is an array of "the occupation as it appeared in one model" items: the occupation's
// reference fields flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference), one per
// resolvable UUID in the occupation's UUIDHistory.
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        description: "The id of the occupation in this model.",
        type: "string",
        pattern: RegExp_Str_ID,
      },
      UUID: {
        description: "The UUID of the occupation in this model.",
        type: "string",
        pattern: RegExp_Str_UUIDv4,
      },
      preferredLabel,
      occupationGroupCode,
      code,
      occupationType,
      isLocalized,
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "preferredLabel", "occupationGroupCode", "code", "occupationType", "isLocalized", "model"],
  },
};

export default SchemaGETHistoryResponse;
