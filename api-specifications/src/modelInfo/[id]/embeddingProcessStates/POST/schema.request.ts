import { SchemaObject } from "ajv";
import EmbeddingsConstants from "../../../../embeddings/constants";

export const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/EmbeddingsRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    embeddingServiceId: {
      description: "The identifier of the embedding model to use for generating the embeddings of the model.",
      type: "string",
      enum: EmbeddingsConstants.EmbeddingServiceIds,
    },
  },
  required: ["embeddingServiceId"],
};

export default SchemaPOSTRequest;
