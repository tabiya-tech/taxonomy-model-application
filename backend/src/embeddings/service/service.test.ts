// silence chatty console
import "_test_utilities/consoleMock";

import { EmbeddingService } from "./service";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "./types";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("Test the EmbeddingService", () => {
  test("should process a task without throwing", async () => {
    // GIVEN an embedding service
    const givenService = new EmbeddingService();
    // AND a task
    const givenTask: IGenerateEmbeddingTask = {
      modelId: getMockStringId(1),
      entityId: getMockStringId(2),
      entityType: EmbeddableEntityType.Skill,
      fields: [EmbeddableField.preferredLabel],
    };
    // AND the console.info is spied on
    const consoleInfoSpy = jest.spyOn(console, "info");

    // WHEN processing the task
    const actualPromise = givenService.processTask(givenTask);

    // THEN expect it to resolve
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect the task to be logged
    expect(consoleInfoSpy).toHaveBeenCalledWith("Generated embedding", {
      modelId: givenTask.modelId,
      entityType: givenTask.entityType,
      entityId: givenTask.entityId,
    });
  });
});
