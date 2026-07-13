// silence chatty console
import "_test_utilities/consoleMock";

import { GeminiService } from "./geminiService";

describe("Test the GeminiService", () => {
  const givenApiKey = "some-api-key";
  const givenModel = "models/gemini-embedding-2";

  test("should throw when the api key is not configured", () => {
    // GIVEN no api key
    // WHEN constructing a GeminiService
    // THEN expect it to throw
    expect(() => new GeminiService("", givenModel)).toThrow("GeminiService: GEMINI_API_KEY is not configured");
  });

  test("should throw when the model is not configured", () => {
    // GIVEN an api key but no model
    // WHEN constructing a GeminiService
    // THEN expect it to throw
    expect(() => new GeminiService(givenApiKey, "")).toThrow("GeminiService: GEMINI_MODEL_NAME is not configured");
  });

  test("should construct successfully with an api key and a model", () => {
    // GIVEN an api key and a model
    // WHEN constructing a GeminiService
    const actualService = new GeminiService(givenApiKey, givenModel);

    // THEN expect the service to be constructed
    expect(actualService).toBeInstanceOf(GeminiService);
  });

  test("should return a batch of embeddings", async () => {
    // GIVEN a GeminiService
    const givenService = new GeminiService(givenApiKey, givenModel);

    // WHEN generating a batch of embeddings
    const actualEmbeddings = await givenService.generateEmbeddingBatch(["foo", "bar"]);

    // THEN expect an array of embeddings to be returned
    expect(actualEmbeddings).toEqual([[]]);
  });

  test("should return a single embedding", async () => {
    // GIVEN a GeminiService
    const givenService = new GeminiService(givenApiKey, givenModel);

    // WHEN generating a single embedding
    const actualEmbedding = await givenService.generateEmbedding("foo");

    // THEN expect the first embedding of the batch to be returned
    expect(actualEmbedding).toEqual([]);
  });
});
