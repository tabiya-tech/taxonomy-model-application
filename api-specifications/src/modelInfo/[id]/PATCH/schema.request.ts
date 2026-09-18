import { SchemaObject } from "ajv";
import ModelInfoConstants from "../../constants";
import { _baseProperties } from "../../schemas.base";

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
};

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_patchProperties)), // deep copy the patch properties
  },
  // A request must ask for something: a release, a change of the available languages, or both. Every branch repeats
  // the property it requires, as ajv's strict mode rejects a "required" that the branch itself does not define.
  anyOf: [
    {
      properties: { released: JSON.parse(JSON.stringify(_patchProperties.released)) },
      required: ["released"],
    },
    {
      properties: { availableLanguages: JSON.parse(JSON.stringify(_patchProperties.availableLanguages)) },
      required: ["availableLanguages"],
    },
  ],
};

export default SchemaPATCHRequest;
