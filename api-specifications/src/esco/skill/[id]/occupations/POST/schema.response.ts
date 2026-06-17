import { SchemaObject } from "ajv";
import { _baseResponseSchema as OccupationBaseResponseSchema } from "../../../../occupation/_shared/schemas.base";
import { RegExp_Str_NotEmptyString } from "../../../../../regex";
import SkillConstants from "../../../_shared/constants";
import SkillEnums from "../../../_shared/enums";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/SkillOccupationsResponseSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...OccupationBaseResponseSchema.properties,
    relationType: {
      description: "Used for ESCO occupations only.",
      type: ["string", "null"],
      enum: [...Object.values(SkillEnums.OccupationToSkillRelationType), null],
    },
    signallingValue: {
      description: "Used for local occupations only.",
      type: ["number", "null"],
      minimum: SkillConstants.SIGNALLING_VALUE_MIN,
      maximum: SkillConstants.SIGNALLING_VALUE_MAX,
    },
    signallingValueLabel: {
      description: "Used for local occupations only.",
      type: ["string", "null"],
      maxLength: SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: OccupationBaseResponseSchema.required,
};

export default SchemaPOSTResponse;
