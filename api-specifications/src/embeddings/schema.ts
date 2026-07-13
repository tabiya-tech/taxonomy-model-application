import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4 } from "../regex";
import EmbeddingsConstants from "./constants";

const EmbeddingModelSchema: SchemaObject = {
  $id: "/components/schemas/EmbeddingModelSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The UUID of the embedding model.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    modelProvider: {
      description: "The provider of the embedding model.",
      type: "string",
      enum: Object.values(EmbeddingsConstants.EEmbeddingModelProvider),
    },
    modelName: {
      description: "The provider specific name of the embedding model.",
      type: "string",
      pattern: RegExp_Str_NotEmptyString,
      maxLength: EmbeddingsConstants.MODEL_NAME_MAX_LENGTH,
    },
    numberOfDimensions: {
      description: "The number of dimensions of the vectors produced by the embedding model.",
      type: "integer",
      minimum: EmbeddingsConstants.MIN_NUMBER_OF_DIMENSIONS,
      maximum: EmbeddingsConstants.MAX_NUMBER_OF_DIMENSIONS,
    },
    enabled: {
      description: "Whether the embedding model is enabled and can be used to trigger an embedding process.",
      type: "boolean",
    },
  },
  required: ["id", "modelProvider", "modelName", "numberOfDimensions", "enabled"],
};

export default EmbeddingModelSchema;
