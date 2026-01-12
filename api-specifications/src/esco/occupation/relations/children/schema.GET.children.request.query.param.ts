import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../../schemas.base";

const SchemaGETChildrenRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestQueryParamSchemaGETChildren",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseQueryParameterSchema,
  },
};

export default SchemaGETChildrenRequestQueryParam;
