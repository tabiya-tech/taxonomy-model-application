import { SchemaObject } from "ajv";
import OccupationConstants from "../../../_shared/constants";
import { RegExp_Str_NotEmptyString } from "../../../../../regex";
import OccupationEnums from "../../../_shared/enums";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../../skill/_shared/schemas.base";

const SchemaPATCHResponse: SchemaObject = {
  $id: "/components/schemas/OccupationSkillItemResponseSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...SkillBaseResponseSchema.properties,
    relationType: {
      description: "The type of relationship between occupation and skill (essential/optional).",
      type: ["string", "null"],
      enum: [...Object.values(OccupationEnums.OccupationToSkillRelationType), null],
    },
    signallingValue: {
      description: "Numeric signalling value for the skill relationship.",
      type: ["number", "null"],
      minimum: OccupationConstants.SIGNALLING_VALUE_MIN,
      maximum: OccupationConstants.SIGNALLING_VALUE_MAX,
    },
    signallingValueLabel: {
      description: "Label for the signalling value.",
      type: ["string", "null"],
      maxLength: OccupationConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: SkillBaseResponseSchema.required,
};

export default SchemaPATCHResponse;
