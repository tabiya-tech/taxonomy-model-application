import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "./schemas.base";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
  },
  required: ["next_cursor"],
};

export default SchemaGETRequestQueryParam;
