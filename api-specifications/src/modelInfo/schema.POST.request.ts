import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties
  },
  required: ["name", "description", "locale", "license", "UUIDHistory"],
};

export default SchemaPOSTRequest;
