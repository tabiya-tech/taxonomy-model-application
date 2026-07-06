import { SchemaObject } from "ajv";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import { _occupationReferenceProperties } from "../../../_shared/schema.reference";

// The history response is an array of "the occupation as it appeared in one model" items: the occupation's
// reference fields flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference), one per
// resolvable UUID in the occupation's UUIDHistory. The flat fields reuse the shared occupation reference
// property definitions (deep-copied so this schema never aliases the originals).
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      ...JSON.parse(JSON.stringify(_occupationReferenceProperties)), // deep copy the occupation reference properties
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "preferredLabel", "occupationGroupCode", "code", "occupationType", "isLocalized", "model"],
  },
};

export default SchemaGETHistoryResponse;
