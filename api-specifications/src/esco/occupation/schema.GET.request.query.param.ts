import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "./schemas.base";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseQueryParameterSchema,
  },
};

export default SchemaGETRequestQueryParam;
