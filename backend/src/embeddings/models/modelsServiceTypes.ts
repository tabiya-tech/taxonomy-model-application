export interface IEmbeddingModelService {
  /**
   * Generate an embedding vector for the given text.
   *
   * @param text - The text to embed.
   * @returns The embedding vector as an array of numbers.
   * @throws If the API key is not configured, or the API  returns an error / empty response.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for a batch of texts.
   * @param texts
   */
  generateEmbeddingBatch(texts: string[]): Promise<number[][]>;
}
