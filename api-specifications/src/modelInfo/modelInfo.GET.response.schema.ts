//getModelInfoResponse is a of the type Array of ModelInfoResponse

import {SchemaObject} from "ajv";
import {_baseResponseSchema} from "./schemas.base";

const ModelInfoResponseSchemaGET: SchemaObject = {
  $id: "/components/schemas/ModelInfoResponseSchemaGET",
  type: "array",
  items: {
    ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
  }
};

export default ModelInfoResponseSchemaGET;