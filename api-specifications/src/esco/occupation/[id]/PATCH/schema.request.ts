import { SchemaObject } from "ajv";
import { _basePatchRequestProperties } from "../../_shared/schemas.base";
import OccupationEnums from "../../_shared/enums";
import OccupationRegexes from "../../_shared/regex";
import OccupationConstants from "../../_shared/constants";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/OccupationRequestSchemaPATCH",
  description:
    "Partially updates the mutable fields of an occupation. Only fields present in the payload are changed; " +
    "omitting a field entirely leaves it untouched. For each translatable field (preferredLabel, altLabels, " +
    "definition, description, regulatedProfessionNote, scopeNote), the request merges per language: only the " +
    "languages present in the field's object are changed, any language already stored but not mentioned in " +
    "the object is left untouched. Setting a language's value to null deletes that language's translation. " +
    "The fallback language (en) can never be deleted: omitting it from the object is fine (English is left " +
    "untouched), but explicitly sending en: null is rejected. altLabels has no stable per-item identity, so " +
    "when present it always replaces the whole list, it is not merged per language.",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._basePatchRequestProperties,
  },
  // Translatable fields accept a partial object keyed by language, e.g. { fr: "..." } to set/merge French
  // only, or { fr: null } to delete French. The fallback language (en) can be omitted (left untouched) but
  // never set to null.
  examples: [
    {
      preferredLabel: { fr: "Cuisinier" },
      description: { en: "Updated description.", fr: null },
      regulatedProfessionNote: { es: "Nota regulada." },
    },
  ],
  if: {
    required: ["occupationType"],
    properties: {
      occupationType: { const: OccupationEnums.OccupationType.ESCOOccupation },
    },
  },
  then: {
    properties: {
      code: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.ESCO_OCCUPATION_CODE,
      },
      occupationGroupCode: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
      },
    },
  },
  else: {
    if: {
      required: ["occupationType"],
      properties: {
        occupationType: { const: OccupationEnums.OccupationType.LocalOccupation },
      },
    },
    then: {
      properties: {
        code: {
          type: "string",
          maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
          pattern: OccupationRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
        },
        occupationGroupCode: {
          type: "string",
          maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
          pattern: `${OccupationRegexes.Str.LOCAL_GROUP_CODE}|${OccupationRegexes.Str.ISCO_GROUP_CODE}`,
        },
      },
    },
  },
};

export default SchemaPATCHRequest;
