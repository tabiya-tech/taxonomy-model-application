import { SchemaObject } from "ajv";
import { _basePaginationResponseProperties } from "../../schemas.base";
import { _baseResponseSchema as OccupationBaseResponseSchema } from "../../../occupation/schemas.base";
import SkillEnums from "../../enums";
import SkillConstants from "../../constants";

const SchemaGETOccupationsResponse: SchemaObject = {
  $id: "/components/schemas/SkillOccupationsResponseSchemaGET",
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
          ...OccupationBaseResponseSchema.properties,
          relationType: {
            description: "Used for ESCOOccupations only.",
            type: ["string", "null"],
            enum: [...Object.values(SkillEnums.OccupationToSkillRelationType), null],
          },
          signallingValue: {
            description: "Used for LocalOccupations only.",
            type: ["number", "null"],
            minimum: SkillConstants.SIGNALLING_VALUE_MIN,
            maximum: SkillConstants.SIGNALLING_VALUE_MAX,
          },
          signallingValueLabel: {
            description: "Used for LocalOccupations only.",
            type: ["string", "null"],
            maxLength: SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH,
            pattern: ".+",
          },
        },
        required: OccupationBaseResponseSchema.required,
      },
      description: "Array of occupations that require this skill.",
    },
    ..._basePaginationResponseProperties,
  },
  required: ["data", "limit"],
};

export default SchemaGETOccupationsResponse;
