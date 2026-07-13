import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";

export interface IEmbeddingProcessService {
  /**
   * Triggers the generation of the embeddings for all the entities of a model.
   *
   * The process:
   *  1. checks that the model exists and has been released (embeddings can only be generated for released models),
   *  2. checks that there is no other unfinished embedding process for the same model,
   *  3. creates a new embedding process state,
   *  4. loops through all the entities of the model (skills, skill groups, occupations, occupation groups) and
   *     pushes each of them to the embeddings queue,
   *  5. updates the embedding process state with the total number of documents that were pushed to the queue.
   *
   * @param {string} modelId - The id of the model to generate the embeddings for.
   * @param {string} embeddingServiceId - The id of the embedding model service to use.
   * @return {Promise<IEmbeddingProcessState>} - A Promise that resolves to the created embedding process state.
   * @throws {ModelNotFoundError} - If the model does not exist.
   * @throws {ModelNotReleasedError} - If the model has not been released.
   * @throws {EmbeddingProcessAlreadyRunningError} - If there is already an unfinished embedding process for the model.
   */
  triggerEmbeddingProcess(modelId: string, embeddingServiceId: string): Promise<IEmbeddingProcessState>;
}
