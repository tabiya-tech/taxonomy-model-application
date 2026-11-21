import { SchemaObject } from "ajv";
import ModelInfoConstants from "../../constants";
import { _baseProperties } from "../../schemas.base";
import { RegExp_Str_UUIDv4 } from "../../../regex";

// UUIDHistory for PATCH uses stricter constraints than the base definition:
// at least 1 entry (the model's current UUID must be present), at most 10,000,
// all valid UUIDs, no duplicates. The membership check (must include the
// model's current UUID) is a handler-level rule that JSON Schema cannot express.
const _patchUUIDHistoryProperty = {
  description:
    "The full UUID history of the model. Must include the model's current UUID. " +
    "Minimum 1 entry, maximum 10,000 entries, all valid UUIDv4, no duplicates.",
  type: "array",
  minItems: 1,
  maxItems: 10_000,
  uniqueItems: true,
  items: {
    type: "string",
    pattern: RegExp_Str_UUIDv4,
  },
};

const _patchProperties = {
  released: {
    description:
      "Releases the model. This endpoint can only be used to release a model (set it to true); it cannot be used to un-release one.",
    type: "boolean",
    const: true,
  },
  releaseNotes: {
    description: "The release notes to record for this release of the model.",
    type: "string",
    maxLength: ModelInfoConstants.RELEASE_NOTES_MAX_LENGTH,
  },
  availableLanguages: {
    ...JSON.parse(JSON.stringify(_baseProperties.availableLanguages)), // deep copy the base availableLanguages property
    description:
      "The full list of the languages the model carries data in. It may add languages to the ones the model " +
      "already declares, it may not drop any of them: removing a language is out of scope and a request that does " +
      "not carry every language of the model is rejected with a 400. It is orthogonal to the locale of the model, " +
      "which this endpoint cannot change.",
  },
  name: JSON.parse(JSON.stringify(_baseProperties.name)),
  description: JSON.parse(JSON.stringify(_baseProperties.description)),
  locale: JSON.parse(JSON.stringify(_baseProperties.locale)),
  license: JSON.parse(JSON.stringify(_baseProperties.license)),
  UUIDHistory: JSON.parse(JSON.stringify(_patchUUIDHistoryProperty)),
};

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_patchProperties)), // deep copy the patch properties
  },
  // A request must ask for at least one meaningful change. Every anyOf branch lists only the property it
  // requires (ajv strict mode rejects a "required" for a property not declared in that branch's own schema).
  anyOf: [
    {
      properties: { released: JSON.parse(JSON.stringify(_patchProperties.released)) },
      required: ["released"],
    },
    {
      properties: { availableLanguages: JSON.parse(JSON.stringify(_patchProperties.availableLanguages)) },
      required: ["availableLanguages"],
    },
    {
      properties: { name: JSON.parse(JSON.stringify(_patchProperties.name)) },
      required: ["name"],
    },
    {
      properties: { description: JSON.parse(JSON.stringify(_patchProperties.description)) },
      required: ["description"],
    },
    {
      properties: { locale: JSON.parse(JSON.stringify(_patchProperties.locale)) },
      required: ["locale"],
    },
    {
      properties: { license: JSON.parse(JSON.stringify(_patchProperties.license)) },
      required: ["license"],
    },
    {
      properties: { UUIDHistory: JSON.parse(JSON.stringify(_patchUUIDHistoryProperty)) },
      required: ["UUIDHistory"],
    },
  ],
  // releaseNotes must only be supplied together with released: true.
  // Expressed as: NOT (releaseNotes is present AND NOT (released is present)).
  // Both subschemas declare the referenced properties so AJV's strictRequired mode is satisfied.
  not: {
    properties: { releaseNotes: JSON.parse(JSON.stringify(_patchProperties.releaseNotes)) },
    required: ["releaseNotes"],
    not: {
      properties: { released: JSON.parse(JSON.stringify(_patchProperties.released)) },
      required: ["released"],
    },
  },
};

export default SchemaPATCHRequest;
