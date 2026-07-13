describe("Test the embeddings module", () => {
  test("The embeddings module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const embeddingsModule = await import("./");

    // THEN Check if the Constants are defined in it
    expect(embeddingsModule.default.Constants.EmbeddingServices).toBeDefined();
    expect(embeddingsModule.default.Constants.EmbeddingServiceIds).toBeDefined();
    expect(embeddingsModule.default.Constants.MAX_EMBEDDING_MODEL_ID_LENGTH).toBeDefined();
  });

  test("The embeddings module matches the snapshot", () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => {
      // THEN Check if the module can be required without error
      const embeddingsModule = await import("./");
      expect(embeddingsModule.default).toMatchSnapshot();
    }).not.toThrowError();
  });
});

export {};
