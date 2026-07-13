import Ajv, { SchemaObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { RegExp_Str_ID } from "server/regex";
import { EmbeddableEntityType, EmbeddableField } from "embeddings/service/types";

/**
 * The AJV schema of a single embedding generation job that travels through the embeddings SQS queue.
 *
 * This schema is backend-only (the frontend never produces or consumes queue jobs) and is used on both
 * ends of the queue:
 *  - the producer (EmbeddingClient) validates a job before pushing it to the queue, and
 *  - the consumer (embeddings lambda) validates a job after receiving it from the queue.
 */
export const EmbeddingQueueJobSchema: SchemaObject = {
  $id: "/components/schemas/EmbeddingQueueJobSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The identifier of the model that the entity belongs to.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    entityId: {
      description: "The identifier of the entity to generate the embedding for.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    entityType: {
      description: "The type of the entity to generate the embedding for.",
      type: "string",
      enum: Object.values(EmbeddableEntityType),
    },
    fields: {
      description: "The fields of the entity that should be embedded.",
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "string",
        enum: Object.values(EmbeddableField),
      },
    },
  },
  required: ["modelId", "entityId", "entityType", "fields"],
};

// A dedicated Ajv instance keeps the embeddings lambda bundle self-contained,
// so it does not need to pull in the full API validator with every api-specification schema.
const ajvInstance = new Ajv({ validateSchema: true, allErrors: true, strict: true });
addFormats(ajvInstance);

export const validateEmbeddingQueueJob: ValidateFunction = ajvInstance.compile(EmbeddingQueueJobSchema);

export default EmbeddingQueueJobSchema;
