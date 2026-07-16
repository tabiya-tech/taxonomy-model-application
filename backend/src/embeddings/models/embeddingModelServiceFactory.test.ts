// silence chatty console
import "_test_utilities/consoleMock";

import EmbeddingsAPISpecs from "api-specifications/embeddings";
import { getEmbeddingModelService } from "./embeddingModelServiceFactory";
import { GeminiService } from "./gemini/geminiService";
import * as configModule from "server/config/config";

describe("Test the getEmbeddingModelService factory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return a GeminiService for an embedding service with the gemini provider", () => {
    // GIVEN the id of an embedding service with the gemini provider
    const givenEmbeddingService = EmbeddingsAPISpecs.Constants.EmbeddingServices.find(
      (service) => service.modelProvider === EmbeddingsAPISpecs.Constants.EEmbeddingModelProvider.GEMINI
    )!;
    // guard to ensure that a gemini embedding service is configured
    expect(givenEmbeddingService).toBeDefined();
    // AND a configured gemini api key
    jest.spyOn(configModule, "getGeminiApiKey").mockReturnValue("some-api-key");

    // WHEN resolving the embedding model service for the given id
    const actualService = getEmbeddingModelService(givenEmbeddingService.id);

    // THEN expect a GeminiService to be returned
    expect(actualService).toBeInstanceOf(GeminiService);
  });

  test("should throw when the embedding service id is unknown", () => {
    // GIVEN an unknown embedding service id
    const givenUnknownEmbeddingServiceId = "00000000-0000-0000-0000-000000000000";

    // WHEN resolving the embedding model service for the given id
    // THEN expect it to throw
    expect(() => getEmbeddingModelService(givenUnknownEmbeddingServiceId)).toThrow(
      `getEmbeddingModelService: unknown embedding service id: ${givenUnknownEmbeddingServiceId}`
    );
  });

  test("should throw when the provider of the embedding service is not supported", () => {
    // GIVEN an embedding service with an unsupported provider
    const givenEmbeddingService = EmbeddingsAPISpecs.Constants.EmbeddingServices[0];
    const givenUnsupportedProvider = "some-unsupported-provider";
    jest
      .spyOn(EmbeddingsAPISpecs.Constants.EmbeddingServices, "find")
      .mockReturnValue({ ...givenEmbeddingService, modelProvider: givenUnsupportedProvider as never });

    // WHEN resolving the embedding model service for the given id
    // THEN expect it to throw
    expect(() => getEmbeddingModelService(givenEmbeddingService.id)).toThrow(
      `getEmbeddingModelService: unsupported model provider: ${givenUnsupportedProvider} for embedding service id: ${givenEmbeddingService.id}`
    );
  });
});
