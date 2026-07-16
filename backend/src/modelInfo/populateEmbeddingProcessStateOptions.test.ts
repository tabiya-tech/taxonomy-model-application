// mute the console output
import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { getMockObjectId, getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import { IEmbeddingProcessStateDoc } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { ModelInfoModelPaths } from "./modelInfoModel";
import { populateEmbeddingProcessStateOptions } from "./populateEmbeddingProcessStateOptions";

/**
 * Helper function to create an embedding process state doc with random-ish values,
 * as it would be provided by mongoose to the populate transform.
 */
function getGivenEmbeddingProcessStateDoc(
  index: number = 1
): IEmbeddingProcessStateDoc & { _id: mongoose.Types.ObjectId } {
  return {
    _id: getMockObjectId(index),
    modelId: getMockObjectId(index + 1),
    status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
    embeddingServiceId: getTestString(10),
    totalDocuments: 100,
    errorCounts: 2,
    warningCounts: 3,
    completedDocuments: 42,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  };
}

describe("Test populateEmbeddingProcessStateOptions", () => {
  test("should populate the embeddingProcessState path", () => {
    // GIVEN the populate options
    // WHEN reading the path
    const actualPath = populateEmbeddingProcessStateOptions.path;

    // THEN expect it to be the model's embeddingProcessState path
    expect(actualPath).toEqual(ModelInfoModelPaths.embeddingProcessState);
  });

  describe("Test transform()", () => {
    test("should transform the embedding process state doc into the API representation", () => {
      // GIVEN an embedding process state doc
      const givenDoc = getGivenEmbeddingProcessStateDoc();

      // WHEN transforming the doc
      const actualTransformed = populateEmbeddingProcessStateOptions.transform(givenDoc);

      // THEN expect it to map every field, stringifying the _id into id
      expect(actualTransformed).toEqual({
        id: givenDoc._id.toString(),
        status: givenDoc.status,
        embeddingServiceId: givenDoc.embeddingServiceId,
        totalDocuments: givenDoc.totalDocuments,
        errorCounts: givenDoc.errorCounts,
        warningCounts: givenDoc.warningCounts,
        completedDocuments: givenDoc.completedDocuments,
        createdAt: givenDoc.createdAt,
        updatedAt: givenDoc.updatedAt,
      });
    });

    test("should return the id as the string representation of the _id", () => {
      // GIVEN an embedding process state doc with a known _id
      const givenIndex = 123;
      const givenDoc = getGivenEmbeddingProcessStateDoc(givenIndex);

      // WHEN transforming the doc
      const actualTransformed = populateEmbeddingProcessStateOptions.transform(givenDoc);

      // THEN expect the id to be the stringified _id
      expect(actualTransformed.id).toEqual(getMockStringId(givenIndex));
      // AND expect the id to be a string
      expect(typeof actualTransformed.id).toBe("string");
    });

    test("should not include the modelId in the transformed result", () => {
      // GIVEN an embedding process state doc (which carries a modelId)
      const givenDoc = getGivenEmbeddingProcessStateDoc();

      // WHEN transforming the doc
      const actualTransformed = populateEmbeddingProcessStateOptions.transform(givenDoc);

      // THEN expect the modelId to be omitted from the result
      expect(actualTransformed).not.toHaveProperty("modelId");
    });

    test.each([
      ["PENDING", ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING],
      ["IN_PROGRESS", ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS],
      ["COMPLETED", ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED],
    ])("should preserve the '%s' status", (_description, givenStatus) => {
      // GIVEN an embedding process state doc with a specific status
      const givenDoc = getGivenEmbeddingProcessStateDoc();
      givenDoc.status = givenStatus;

      // WHEN transforming the doc
      const actualTransformed = populateEmbeddingProcessStateOptions.transform(givenDoc);

      // THEN expect the status to be preserved
      expect(actualTransformed.status).toEqual(givenStatus);
    });
  });
});
