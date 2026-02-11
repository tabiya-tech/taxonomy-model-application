import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema, _basePaginationResponseProperties } from "../../schemas.base";

const SchemaGETChildrenResponse: SchemaObject = {
  $id: "/components/schemas/SkillChildrenResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          ...SkillBaseResponseSchema.properties,
        },
        required: SkillBaseResponseSchema.required,
      },
      description: "Array of child skills for the current page.",
    },
    ..._basePaginationResponseProperties,
  },
  required: ["data", "limit"],
};

export default SchemaGETChildrenResponse;
