/**
 * The event payload of the async-publish-embeddings-task lambda.
 *
 * The POST /models/{modelId}/embedding-processes endpoint creates the embedding process state
 * synchronously and then invokes this lambda asynchronously with this payload, so that the heavy work of
 * streaming every entity of the model from the database and pushing it to the embeddings queue happens in
 * the background (and does not block the API request, which would otherwise time out on large models).
 */
export interface IPublishEmbeddingsTaskEvent {
  /** The id of the embedding process state that was created by the POST endpoint. */
  processId: string;
  /** The id of the model whose entities should be published to the embeddings queue. */
  modelId: string;
  /** The id of the embedding model service to use. */
  embeddingServiceId: string;
}

/**
 * Invokes the async-publish-embeddings-task lambda asynchronously.
 * Injected into the EmbeddingProcessService so that the AWS SDK can be mocked out in unit tests.
 */
export interface IAsyncPublishEmbeddingsTaskInvoker {
  /**
   * Invokes the async-publish-embeddings-task lambda with the given event.
   * @throws if the lambda could not be invoked.
   */
  invoke(event: IPublishEmbeddingsTaskEvent): Promise<void>;
}
