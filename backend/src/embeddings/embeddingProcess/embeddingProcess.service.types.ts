import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";

export interface IEmbeddingProcessService {
  /**
   * Triggers the generation of the embeddings for all the entities of a model.
   *
   * This is the fast, synchronous part of the process, invoked from the POST endpoint:
   *  1. checks that the model exists and has been released (embeddings can only be generated for released models),
   *  2. checks that there is no other unfinished embedding process for the same model,
   *  3. creates a new embedding process state in the PENDING status,
   *  4. invokes the async-publish-embeddings-task lambda, which does the slow work of streaming every entity
   *     of the model from the database and pushing it to the embeddings queue in the background.
   *
   * @param {string} modelId - The id of the model to generate the embeddings for.
   * @param {string} embeddingServiceId - The id of the embedding model service to use.
   * @return {Promise<IEmbeddingProcessState>} - A Promise that resolves to the created (PENDING) embedding process state.
   * @throws {ModelNotFoundError} - If the model does not exist.
   * @throws {ModelNotReleasedError} - If the model has not been released.
   * @throws {EmbeddingProcessAlreadyRunningError} - If there is already an unfinished embedding process for the model.
   */
  triggerEmbeddingProcess(modelId: string, embeddingServiceId: string): Promise<IEmbeddingProcessState>;

  /**
   * Publishes every entity of a model to the embeddings queue. This is the slow part of the process, run in
   * the background by the async-publish-embeddings-task lambda after {@link triggerEmbeddingProcess} created
   * the process state. It:
   *  1. marks all the entities of the model as PENDING for the embedding service,
   *  2. loops through all the entities of the model (skills, skill groups, occupations, occupation groups) and
   *     pushes each of them to the embeddings queue,
   *  3. updates the embedding process state with the total number of documents that were pushed to the queue.
   *
   * On failure it cleans up the process state so that the model is not left blocked by an orphaned record.
   *
   * @param {string} processId - The id of the embedding process state created by {@link triggerEmbeddingProcess}.
   * @param {string} modelId - The id of the model to generate the embeddings for.
   * @param {string} embeddingServiceId - The id of the embedding model service to use.
   * @return {Promise<void>} - A Promise that resolves once all the entities have been published to the queue.
   */
  publishEmbeddingTasks(processId: string, modelId: string, embeddingServiceId: string): Promise<void>;
}
