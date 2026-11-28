import { SchemaObject } from "ajv";
import { _baseProperties } from "../../schemas.base";
import PUTModelConstants from "./constants";

const _uuidHistory = JSON.parse(JSON.stringify(_baseProperties.UUIDHistory));

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
    UUIDHistory: {
      ..._uuidHistory,
      minItems: 1,
      maxItems: PUTModelConstants.UUID_HISTORY_MAX_ITEMS,
      uniqueItems: true,
    },
  },
  required: ["name", "description", "locale", "availableLanguages", "license", "UUIDHistory"],
};

export default SchemaPUTRequest;
