import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../../schemas.base";

const SchemaGETSkillsRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationRequestQueryParamSchemaGETSkills",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseQueryParameterSchema,
  },
};

export default SchemaGETSkillsRequestQueryParam;
