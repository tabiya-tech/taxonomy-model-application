import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    root: {
      description: "Filter only root occupation groups (occupation groups with no parent).",
      type: "boolean",
    },
  },
};

export default SchemaGETRequestQueryParam;
