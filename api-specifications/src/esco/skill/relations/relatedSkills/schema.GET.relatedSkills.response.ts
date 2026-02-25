import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema, _basePaginationResponseProperties } from "../../schemas.base";
import SkillEnums from "../../enums";

const SchemaGETRelatedSkillsResponse: SchemaObject = {
  $id: "/components/schemas/SkillRelatedResponseSchemaGET",
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
          relationType: {
            description: "The type of relationship between skills.",
            type: "string",
            enum: Object.values(SkillEnums.SkillToSkillRelationType),
          },
        },
        required: [...SkillBaseResponseSchema.required, "relationType"],
      },
      description: "Array of related skills for the current page.",
    },
    ..._basePaginationResponseProperties,
  },
  required: ["data", "limit"],
};

export default SchemaGETRelatedSkillsResponse;
