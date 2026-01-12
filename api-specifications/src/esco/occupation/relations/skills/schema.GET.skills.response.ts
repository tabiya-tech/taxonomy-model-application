import { SchemaObject } from "ajv";
import OccupationConstants from "../../constants";
import { RegExp_Str_NotEmptyString } from "../../../../regex";
import OccupationEnums from "../../enums";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../../skill/schemas.base";

const SchemaGETSkillsResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETSkills",
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      items: {
        $id: "/components/schemas/OccupationSkillItem",
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
      },
      description: "Array of skills required by the occupation for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of data returned in this page.",
      minimum: 1,
      maximum: OccupationConstants.MAX_LIMIT,
      default: OccupationConstants.DEFAULT_LIMIT,
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: OccupationConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
};

export default SchemaGETSkillsResponse;
