// silence chatty console
import "_test_utilities/consoleMock";

import ModelInfoApiSpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";
import { transformEmbeddingProcessState } from "./transform";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("Test transformEmbeddingProcessState", () => {
  test("should transform an embedding process state into the API response payload", () => {
    // GIVEN an embedding process state
    const givenCreatedAt = new Date("2024-01-01T00:00:00.000Z");
    const givenUpdatedAt = new Date("2024-01-02T00:00:00.000Z");
    const givenEmbeddingProcessState: IEmbeddingProcessState = {
      id: getMockStringId(1),
      modelId: getMockStringId(2),
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: "gemini$$models/gemini-embedding-2",
      totalDocuments: 100,
      errorCounts: 1,
      warningCounts: 2,
      completedDocuments: 50,
      createdAt: givenCreatedAt,
      updatedAt: givenUpdatedAt,
    };

    // WHEN transforming the embedding process state
    const actualPayload = transformEmbeddingProcessState(givenEmbeddingProcessState);

    // THEN expect the payload to match the embedding process state with the dates as ISO strings
    const expectedPayload: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Types.Response.Payload = {
      id: givenEmbeddingProcessState.id,
      modelId: givenEmbeddingProcessState.modelId,
      status: givenEmbeddingProcessState.status,
      embeddingServiceId: givenEmbeddingProcessState.embeddingServiceId,
      totalDocuments: givenEmbeddingProcessState.totalDocuments,
      errorCounts: givenEmbeddingProcessState.errorCounts,
      warningCounts: givenEmbeddingProcessState.warningCounts,
      completedDocuments: givenEmbeddingProcessState.completedDocuments,
      createdAt: givenCreatedAt.toISOString(),
      updatedAt: givenUpdatedAt.toISOString(),
    };
    expect(actualPayload).toEqual(expectedPayload);
  });

  test("the transformed payload should conform to the response schema", () => {
    // GIVEN an embedding process state
    const givenEmbeddingProcessState: IEmbeddingProcessState = {
      id: getMockStringId(1),
      modelId: getMockStringId(2),
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
      embeddingServiceId: EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0],
      totalDocuments: 0,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // WHEN transforming the embedding process state
    const actualPayload = transformEmbeddingProcessState(givenEmbeddingProcessState);

    // THEN expect the payload to have all the required properties
    const requiredProperties = ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Schemas.Response.Payload
      .required as string[];
    requiredProperties.forEach((property) => {
      expect(actualPayload).toHaveProperty(property);
    });
  });
});
