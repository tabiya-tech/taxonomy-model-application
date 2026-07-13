/**
 * Thrown when an embedding process is triggered for a model that does not exist.
 */
export class ModelNotFoundError extends Error {
  constructor(modelId: string) {
    super(`Model with id ${modelId} was not found`);
    this.name = "ModelNotFoundError";
  }
}

/**
 * Thrown when an embedding process is triggered for a model that has not been released.
 * Embeddings can only be generated for released models.
 */
export class ModelNotReleasedError extends Error {
  constructor(modelId: string) {
    super(`Model with id ${modelId} is not released; embeddings can only be generated for released models`);
    this.name = "ModelNotReleasedError";
  }
}

/**
 * Thrown when an embedding process is triggered for a model that already has an unfinished embedding process.
 * The new process should wait for the previous one to complete.
 */
export class EmbeddingProcessAlreadyRunningError extends Error {
  constructor(modelId: string) {
    super(`An embedding process is already running for model with id ${modelId}`);
    this.name = "EmbeddingProcessAlreadyRunningError";
  }
}

/**
 * Thrown when an error occurs while interacting with the database.
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}
