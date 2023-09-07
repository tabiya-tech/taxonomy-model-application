import {SchemaObject} from "ajv";
import {_baseProperties} from "./schemas.base";

const ModelInfoRequestSchemaPOST: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)) // deep copy the base properties
  },
  required: [
    "name",
    "description",
    "locale"
  ]
};

export default ModelInfoRequestSchemaPOST;