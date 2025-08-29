import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties of OccupationGroup
  },
  required: ["preferredLabel", "originUri", "UUIDHistory", "code", "description", "altLabels", "importId", "modelId"],
};

export default SchemaPOSTRequest;
