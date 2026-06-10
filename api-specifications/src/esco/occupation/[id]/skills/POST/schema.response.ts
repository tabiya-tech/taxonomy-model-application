import { SchemaObject } from "ajv";
import OccupationConstants from "../../../_shared/constants";
import { RegExp_Str_NotEmptyString } from "../../../../../regex";
import OccupationEnums from "../../../_shared/enums";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../../skill/_shared/schemas.base";

const SchemaPOSTResponse: SchemaObject = {
  $id: "/components/schemas/OccupationSkillItemResponseSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    // Include all properties from the skill base response schema
    ...SkillBaseResponseSchema.properties,
    // Add occupation-to-skill relationship metadata
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
  // Keep all required fields from skill base schema
  required: SkillBaseResponseSchema.required,
};

export default SchemaPOSTResponse;
