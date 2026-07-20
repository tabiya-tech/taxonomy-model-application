// silence chatty console
import "_test_utilities/consoleMock";

import { GeminiService, GEMINI_API_BASE_URL, GEMINI_MAX_BATCH_SIZE, TaskType } from "./geminiService";

function getMockFetchResponse(payload: object, status: number = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
    text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
  };
}

describe("Test the GeminiService", () => {
  const givenApiKey = "some-api-key";
  const givenModel = "models/gemini-embedding-2";
  const givenOutputDimensionality = 768;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test("should throw when the api key is not configured", () => {
    // GIVEN no api key
    // WHEN constructing a GeminiService
    // THEN expect it to throw
    expect(() => new GeminiService("", givenModel, givenOutputDimensionality)).toThrow(
      "GeminiService: GEMINI_API_KEY is not configured"
    );
  });

  test("should throw when the model is not configured", () => {
    // GIVEN an api key but no model
    // WHEN constructing a GeminiService
    // THEN expect it to throw
    expect(() => new GeminiService(givenApiKey, "", givenOutputDimensionality)).toThrow(
      "GeminiService: GEMINI_MODEL_NAME is not configured"
    );
  });

  test.each([
    ["zero", 0],
    ["a negative number", -1],
  ])("should throw when the output dimensionality is %s", (_description, givenInvalidOutputDimensionality) => {
    // GIVEN an api key and a model but an invalid output dimensionality
    // WHEN constructing a GeminiService
    // THEN expect it to throw
    expect(() => new GeminiService(givenApiKey, givenModel, givenInvalidOutputDimensionality)).toThrow(
      "GeminiService: GEMINI_OUTPUT_DIMENSIONALITY is not configured"
    );
  });

  test("should construct successfully with an api key, a model and an output dimensionality", () => {
    // GIVEN an api key, a model and an output dimensionality
    // WHEN constructing a GeminiService
    const actualService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);

    // THEN expect the service to be constructed
    expect(actualService).toBeInstanceOf(GeminiService);
  });

  describe("Test generateEmbeddingBatch", () => {
    test("should return one embedding per text from a single batchEmbedContents request", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND two texts to embed
      const givenTexts = ["foo", "bar"];
      // AND the Gemini API returns one embedding per text
      const givenVectors = [
        [0.1, 0.2],
        [0.3, 0.4],
      ];
      fetchSpy.mockResolvedValue(
        getMockFetchResponse({ embeddings: givenVectors.map((values) => ({ values })) }) as never
      );

      // WHEN generating a batch of embeddings
      const actualEmbeddings = await givenService.generateEmbeddingBatch(givenTexts);

      // THEN expect the embeddings of the texts to be returned in order
      expect(actualEmbeddings).toEqual(givenVectors);
      // AND expect the Gemini API to have been called once with the expected request
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(`${GEMINI_API_BASE_URL}/${givenModel}:batchEmbedContents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": givenApiKey,
        },
        body: JSON.stringify({
          requests: givenTexts.map((text) => ({
            outputDimensionality: givenOutputDimensionality,
            taskType: TaskType,
            model: givenModel,
            content: { parts: [{ text }] },
          })),
        }),
      });
    });

    test("should return an empty array without calling the Gemini API when there is no text", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);

      // WHEN generating a batch of embeddings for no texts
      const actualEmbeddings = await givenService.generateEmbeddingBatch([]);

      // THEN expect an empty array to be returned
      expect(actualEmbeddings).toEqual([]);
      // AND expect the Gemini API to not have been called
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test("should chunk the texts into multiple requests when there are more texts than the maximum batch size", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND more texts than fit in a single batch
      const givenTextCount = GEMINI_MAX_BATCH_SIZE + 2;
      const givenTexts = Array.from({ length: givenTextCount }, (_, index) => `text-${index}`);
      // AND the Gemini API returns one embedding per text of each chunk
      fetchSpy.mockImplementation((_url: never, init: never) => {
        const requestBody = JSON.parse((init as { body: string }).body);
        const embeddings = requestBody.requests.map(() => ({ values: [0.1, 0.2] }));
        return Promise.resolve(getMockFetchResponse({ embeddings }) as never);
      });

      // WHEN generating a batch of embeddings
      const actualEmbeddings = await givenService.generateEmbeddingBatch(givenTexts);

      // THEN expect one embedding per text to be returned
      expect(actualEmbeddings).toHaveLength(givenTextCount);
      // AND expect the Gemini API to have been called once per chunk
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      // AND expect no request to exceed the maximum batch size
      const actualRequestSizes = fetchSpy.mock.calls.map(
        ([, init]) => JSON.parse((init as { body: string }).body).requests.length
      );
      expect(actualRequestSizes).toEqual([GEMINI_MAX_BATCH_SIZE, 2]);
    });

    test("should throw when the request to the Gemini API fails", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the request to the Gemini API will fail (e.g. a network error)
      const givenCause = new Error("network error");
      fetchSpy.mockRejectedValue(givenCause);

      // WHEN generating a batch of embeddings
      const actualPromise = givenService.generateEmbeddingBatch(["foo"]);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "GeminiService.batchEmbedContents: the request to the Gemini API failed",
          givenCause.message
        )
      );
    });

    test("should throw when the Gemini API responds with an error status", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the Gemini API responds with an error status
      fetchSpy.mockResolvedValue(getMockFetchResponse({ error: { message: "quota exceeded" } }, 429) as never);

      // WHEN generating a batch of embeddings
      const actualPromise = givenService.generateEmbeddingBatch(["foo"]);

      // THEN expect it to reject with an error that contains the status and the response body
      await expect(actualPromise).rejects.toThrow(
        "GeminiService.batchEmbedContents: the Gemini API responded with status 429"
      );
    });

    test("should throw when the Gemini API returns a different number of embeddings than texts", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the Gemini API returns fewer embeddings than texts
      fetchSpy.mockResolvedValue(getMockFetchResponse({ embeddings: [{ values: [0.1] }] }) as never);

      // WHEN generating a batch of embeddings for two texts
      const actualPromise = givenService.generateEmbeddingBatch(["foo", "bar"]);

      // THEN expect it to reject with an error
      await expect(actualPromise).rejects.toThrow(
        "GeminiService.batchEmbedContents: the Gemini API returned 1 embeddings for 2 texts"
      );
    });

    test("should throw when the Gemini API returns no embeddings at all", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the Gemini API returns a payload without embeddings
      fetchSpy.mockResolvedValue(getMockFetchResponse({}) as never);

      // WHEN generating a batch of embeddings
      const actualPromise = givenService.generateEmbeddingBatch(["foo"]);

      // THEN expect it to reject with an error
      await expect(actualPromise).rejects.toThrow(
        "GeminiService.batchEmbedContents: the Gemini API returned 0 embeddings for 1 texts"
      );
    });

    test("should throw when the Gemini API returns an empty embedding", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the Gemini API returns an empty embedding for the second text
      fetchSpy.mockResolvedValue(getMockFetchResponse({ embeddings: [{ values: [0.1] }, { values: [] }] }) as never);

      // WHEN generating a batch of embeddings
      const actualPromise = givenService.generateEmbeddingBatch(["foo", "bar"]);

      // THEN expect it to reject with an error that points at the empty embedding
      await expect(actualPromise).rejects.toThrow(
        "GeminiService.batchEmbedContents: the Gemini API returned an empty embedding at index 1"
      );
    });
  });

  describe("Test generateEmbedding", () => {
    test("should return the single embedding of the text", async () => {
      // GIVEN a GeminiService
      const givenService = new GeminiService(givenApiKey, givenModel, givenOutputDimensionality);
      // AND the Gemini API returns one embedding
      const givenVector = [0.1, 0.2, 0.3];
      fetchSpy.mockResolvedValue(getMockFetchResponse({ embeddings: [{ values: givenVector }] }) as never);

      // WHEN generating a single embedding
      const actualEmbedding = await givenService.generateEmbedding("foo");

      // THEN expect the embedding of the text to be returned
      expect(actualEmbedding).toEqual(givenVector);
    });
  });
});
