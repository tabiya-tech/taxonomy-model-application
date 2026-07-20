import EmbeddingsAPISpecs from "api-specifications/embeddings";
import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";
import { GeminiService } from "embeddings/models/gemini/geminiService";
import { getGeminiApiKey } from "server/config/config";

/**
 * A factory that resolves an embedding service id (see EmbeddingsConstants.EmbeddingServices)
 * to the model service that can generate the embeddings for it.
 */
export type EmbeddingModelServiceFactory = (embeddingServiceId: string) => IEmbeddingModelService;

export const getEmbeddingModelService: EmbeddingModelServiceFactory = (
  embeddingServiceId: string
): IEmbeddingModelService => {
  const embeddingService = EmbeddingsAPISpecs.Constants.EmbeddingServices.find(
    (service) => service.id === embeddingServiceId
  );
  if (!embeddingService) {
    throw new Error(`getEmbeddingModelService: unknown embedding service id: ${embeddingServiceId}`);
  }

  switch (embeddingService.modelProvider) {
    case EmbeddingsAPISpecs.Constants.EEmbeddingModelProvider.GEMINI:
      return new GeminiService(getGeminiApiKey(), embeddingService.modelName, embeddingService.numberOfDimensions);
    default:
      throw new Error(
        `getEmbeddingModelService: unsupported model provider: ${embeddingService.modelProvider} for embedding service id: ${embeddingServiceId}`
      );
  }
};
