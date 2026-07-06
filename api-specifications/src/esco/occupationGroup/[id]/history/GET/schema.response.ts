import { SchemaObject } from "ajv";
import ModelInfoAPISpecs from "../../../../../modelInfo";
import { _occupationGroupReferenceProperties } from "../../../_shared/schema.reference";

// The history response is an array of "the occupation group as it appeared in one model" items: the group's
// reference fields flat at the top level, plus a nested stripped-down `model` (a ModelInfoReference). The flat
// fields reuse the shared occupation group reference property definitions (deep-copied so this schema never
// aliases the originals).
const SchemaGETHistoryResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGETHistory",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      ...JSON.parse(JSON.stringify(_occupationGroupReferenceProperties)), // deep copy the reference properties
      model: {
        $ref: ModelInfoAPISpecs.Schemas.Reference.$id,
      },
    },
    required: ["id", "UUID", "code", "preferredLabel", "objectType", "model"],
  },
};

export default SchemaGETHistoryResponse;
