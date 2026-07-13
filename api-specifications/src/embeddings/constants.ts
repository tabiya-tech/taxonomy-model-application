namespace EmbeddingsConstants {
  export enum EEmbeddingModelProvider {
    GEMINI = "gemini",
  }

  export interface IEmbeddingService {
    id: string;
    modelProvider: EEmbeddingModelProvider;
    modelName: string;
    numberOfDimensions: number;
    enabled: boolean;
  }

  export const EmbeddingServices: IEmbeddingService[] = [
    {
      id: `77bb8ff3-a6b0-460b-bcaa-00631a907852`,
      modelProvider: EEmbeddingModelProvider.GEMINI,
      modelName: "models/gemini-embedding-2",
      numberOfDimensions: 768,
      enabled: false,
    },
  ];

  /**
   * The identifiers of the embedding models that are supported.
   * These are the only values accepted as the `embeddingServiceId` when triggering an embedding process.
   */
  export const EmbeddingServiceIds = Array.from(new Set(EmbeddingServices.map((model) => model.id)));

  // Since the embedding model id is a UUID, it is 36 characters long.
  export const MAX_EMBEDDING_MODEL_ID_LENGTH = 36;

  // The maximum length of the human/provider readable name of an embedding model (e.g. "models/gemini-embedding-2").
  export const MODEL_NAME_MAX_LENGTH = 256;

  // The bounds for the number of dimensions produced by an embedding model.
  export const MIN_NUMBER_OF_DIMENSIONS = 1;
  export const MAX_NUMBER_OF_DIMENSIONS = 100000;
}

export default EmbeddingsConstants;
