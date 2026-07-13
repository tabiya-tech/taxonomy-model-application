describe("Test the EmbeddingProcessStates module", () => {
  test("The EmbeddingProcessStates module can be required via the index", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    expect(async () => await import("./")).not.toThrow(); // We check that it doesn't throw an error instead of simply letting it fail on import because we want an easier error message
    const embeddingProcessStatesModule = await import("./");

    // THEN Check if the POST operation Schemas are defined in it
    expect(embeddingProcessStatesModule.default.POST.Schemas.Request.Payload).toBeDefined();
    expect(embeddingProcessStatesModule.default.POST.Schemas.Response.Payload).toBeDefined();
    // AND Check if the various exports are defined in it
    expect(embeddingProcessStatesModule.default.Enums.Status).toBeDefined();
  });

  test("The EmbeddingProcessStates module matches the snapshot", async () => {
    // GIVEN the module
    // WHEN the module is required via the index
    const embeddingProcessStatesModule = await import("./");
    // THEN expect the module to match the snapshot
    expect(embeddingProcessStatesModule.default).toMatchSnapshot();
  });
});

export {};
