import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "./schemas.base";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
  },
  required: ["cursor"],
};

export default SchemaGETRequestQueryParam;
