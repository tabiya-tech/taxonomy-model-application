import { SchemaObject } from "ajv";
import { _baseRequestProperties } from "../../_shared/schemas.base";
import OccupationEnums from "../../_shared/enums";
import OccupationRegexes from "../../_shared/regex";
import OccupationConstants from "../../_shared/constants";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationRequestSchemaPUT",
  description:
    "Fully replaces the mutable fields of an occupation. For each translatable field (preferredLabel, " +
    "altLabels, definition, description, regulatedProfessionNote, scopeNote), the request must supply the " +
    "complete set of languages to keep: any language present in the stored occupation but omitted from " +
    "this field's object will be removed. The fallback language (en) must always be present in each " +
    "field's object.",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseRequestProperties,
  },
  // Translatable fields (preferredLabel, altLabels, definition, description, regulatedProfessionNote,
  // scopeNote) accept an object keyed by language, e.g. { en: "...", fr: "..." }. Only the fallback
  // language (en) is required per field; omitting any other language removes it (full replace).
  examples: [
    {
      code: "1234.5",
      occupationGroupCode: "1234",
      occupationType: OccupationEnums.OccupationType.ESCOOccupation,
      originUri: "https://example.com/occupations/1234",
      UUIDHistory: ["b8f0a8d0-6b6a-4b6a-8b6a-6b6a4b6a8b6a"],
      modelId: "5f9f1b9b9c9d9c9d9c9d9c9d",
      isLocalized: false,
      preferredLabel: { en: "Cook", fr: "Cuisinier" },
      altLabels: [{ en: "Chef" }, { en: "Line cook", fr: "Cuisinier de ligne" }],
      definition: { en: "Prepares food in a kitchen." },
      description: { en: "Additional information.", fr: "Informations supplémentaires." },
      regulatedProfessionNote: { en: "Not a regulated profession." },
      scopeNote: { en: "Applies to commercial kitchens." },
    },
  ],
  if: {
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

  required: [
    "code",
    "occupationGroupCode",
    "preferredLabel",
    "originUri",
    "UUIDHistory",
    "altLabels",
    "definition",
    "description",
    "regulatedProfessionNote",
    "scopeNote",
    "modelId",
    "occupationType",
    "isLocalized",
  ],
};

export default SchemaPUTRequest;
