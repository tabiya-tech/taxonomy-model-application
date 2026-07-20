import { SchemaObject } from "ajv";
import ModelInfoConstants from "../../constants";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/ModelInfoRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
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
  },
  required: ["released"],
};

export default SchemaPATCHRequest;
