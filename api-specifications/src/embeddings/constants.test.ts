import EmbeddingsConstants from "./constants";

describe("Test the Embeddings Constants", () => {
  describe("Test the EmbeddingModels registry", () => {
    test("every embedding model should have a unique id in the entire registry", () => {
      // GIVEN the registry of embedding models
      const givenEmbeddingModels = EmbeddingsConstants.EmbeddingServices;

      // WHEN the unique ids are extracted from the registry
      const actualUniqueIds = new Set(givenEmbeddingModels.map((model) => model.id));

      // THEN expect as many unique ids as there are registered embedding models
      expect(actualUniqueIds.size).toBe(givenEmbeddingModels.length);
    });

    test("the EmbeddingServiceIds should have one id for every registered embedding model", () => {
      // GIVEN the registry of embedding models
      // WHEN the supported embedding model ids are derived from the registry
      // THEN expect the number of ids to be the same as the number of registered embedding models
      expect(EmbeddingsConstants.EmbeddingServiceIds).toHaveLength(EmbeddingsConstants.EmbeddingServices.length);
    });
  });

  test.each(EmbeddingsConstants.EmbeddingServices.map((model) => [model.modelName, model] as const))(
    "the embedding model '%s' should match the snapshot",
    (_modelName, givenEmbeddingModel) => {
      // GIVEN an embedding model from the registry

      // WHEN the embedding model is inspected
      // THEN expect the embedding model to match the snapshot
      expect(givenEmbeddingModel).toMatchSnapshot();
    }
  );
});
