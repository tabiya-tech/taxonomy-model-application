import { SchemaObject } from "ajv";
import { RegExp_Str_ID } from "../../../../regex";
import EmbeddingProcessStatesEnums from "./enums";
import EmbeddingsConstants from "../../../../embeddings/constants";

const SchemaPOSTResponse: SchemaObject = {
  description:
    "The state of the embedding process of the model. Since the embedding process is asynchronous, use the status to check if the embedding process has completed and the counts to check its progress.",
  $id: "/components/schemas/EmbeddingsResponseSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The identifier of the specific embedding process state.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    modelId: {
      description: "The identifier of the model whose entities are being embedded.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    status: {
      description: "The status of the embedding process of the model.",
      type: "string",
      enum: Object.values(EmbeddingProcessStatesEnums.Status),
    },
    embeddingServiceId: {
      description: "The identifier of the embedding model that is used to generate the embeddings.",
      type: "string",
      enum: EmbeddingsConstants.EmbeddingServiceIds,
    },
    totalDocuments: {
      description: "The total number of documents (entities) that will be embedded.",
      type: "integer",
      minimum: 0,
    },
    errorCounts: {
      description: "The number of documents that failed to be embedded.",
      type: "integer",
      minimum: 0,
    },
    warningCounts: {
      description: "The number of documents that were embedded with warnings.",
      type: "integer",
      minimum: 0,
    },
    completedDocuments: {
      description: "The number of documents that have been successfully embedded so far.",
      type: "integer",
      minimum: 0,
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "modelId",
    "status",
    "embeddingServiceId",
    "totalDocuments",
    "errorCounts",
    "warningCounts",
    "completedDocuments",
    "createdAt",
    "updatedAt",
  ],
};

export default SchemaPOSTResponse;
