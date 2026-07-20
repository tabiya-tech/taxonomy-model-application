// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { EmbeddableField } from "embeddings/service/types";
import { EntityEmbeddingRepository } from "./entityEmbeddingRepository";
import { EntityEmbeddingIdPath, ISkillEmbeddingDoc, IVectorSearchParams } from "./entityEmbedding.types";
import { SkillsEmbeddingsVectorSearchIndexName } from "./vectorSearchIndex.constant";

/**
 * vectorSearch runs an Atlas `$vectorSearch` aggregation, which mongodb-memory-server does not support, so these
 * tests exercise it against a mocked mongoose model and assert the shape of the pipeline it builds.
 */
describe("EntityEmbeddingRepository.vectorSearch (mocked model)", () => {
  function setup(aggregateResult: unknown[]) {
    const mockExec = jest.fn().mockResolvedValue(aggregateResult);
    const mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });
    const mockModel = { aggregate: mockAggregate } as unknown as mongoose.Model<ISkillEmbeddingDoc>;
    const repository = new EntityEmbeddingRepository<ISkillEmbeddingDoc>(mockModel, EntityEmbeddingIdPath.skillId);
    return { repository, mockAggregate, mockExec };
  }

  const givenParams: IVectorSearchParams = {
    indexName: SkillsEmbeddingsVectorSearchIndexName,
    modelId: getMockStringId(1),
    embeddingServiceId: "some-embedding-service-id",
    queryVector: [0.1, 0.2, 0.3],
    searchFields: [EmbeddableField.preferredLabel, EmbeddableField.description],
    limit: 3,
    offset: 6,
  };

  test("should build a $vectorSearch pipeline scoped to the model, service and fields and return ranked hits", async () => {
    // GIVEN the aggregation returns two ranked, grouped rows
    const givenEntityId1 = new mongoose.Types.ObjectId(getMockStringId(10));
    const givenEntityId2 = new mongoose.Types.ObjectId(getMockStringId(11));
    const { repository, mockAggregate } = setup([
      { _id: givenEntityId1, score: 0.9 },
      { _id: givenEntityId2, score: 0.8 },
    ]);

    // WHEN vectorSearch is called
    const actual = await repository.vectorSearch(givenParams);

    // THEN expect the pipeline to start with a $vectorSearch stage scoped to the model/service/fields
    const actualPipeline = mockAggregate.mock.calls[0][0];
    const actualVectorStage = actualPipeline[0].$vectorSearch;
    expect(actualVectorStage.index).toBe(SkillsEmbeddingsVectorSearchIndexName);
    expect(actualVectorStage.path).toBe("vector");
    expect(actualVectorStage.queryVector).toEqual(givenParams.queryVector);
    expect(actualVectorStage.filter.embeddingServiceId).toEqual({ $eq: givenParams.embeddingServiceId });
    expect(actualVectorStage.filter.sourceField).toEqual({ $in: givenParams.searchFields });
    expect(actualVectorStage.filter.modelId).toBeInstanceOf(mongoose.Types.ObjectId);
    // AND to over-fetch searchTopK = (offset + limit) * numFields embedding documents
    expect(actualVectorStage.limit).toBe((givenParams.offset + givenParams.limit) * givenParams.searchFields.length);
    // AND to group by the entity id path, then sort by score, then skip the offset and limit the page
    expect(actualPipeline).toEqual(
      expect.arrayContaining([
        { $group: { _id: "$skillId", score: { $max: "$_vectorSearchScore" } } },
        { $sort: { score: -1, _id: 1 } },
        { $skip: givenParams.offset },
        { $limit: givenParams.limit },
      ])
    );
    // AND the ranked hits to be returned with stringified entity ids
    expect(actual).toEqual([
      { entityId: `${givenEntityId1}`, score: 0.9 },
      { entityId: `${givenEntityId2}`, score: 0.8 },
    ]);
  });

  test("should default the field count to at least one when no searchFields are given", async () => {
    // GIVEN no searchFields
    const { repository, mockAggregate } = setup([]);

    // WHEN vectorSearch is called with an empty searchFields
    await repository.vectorSearch({ ...givenParams, searchFields: [], offset: 0, limit: 2 });

    // THEN expect searchTopK to fall back to need * 1 (not zero)
    const actualVectorStage = mockAggregate.mock.calls[0][0][0].$vectorSearch;
    expect(actualVectorStage.limit).toBe(2);
  });

  test("should throw and log when the aggregation fails", async () => {
    // GIVEN the aggregation rejects
    const givenError = new Error("aggregation failed");
    const mockAggregate = jest.fn().mockReturnValue({ exec: jest.fn().mockRejectedValue(givenError) });
    const mockModel = { aggregate: mockAggregate } as unknown as mongoose.Model<ISkillEmbeddingDoc>;
    const repository = new EntityEmbeddingRepository<ISkillEmbeddingDoc>(mockModel, EntityEmbeddingIdPath.skillId);

    // WHEN vectorSearch is called THEN expect it to reject and log the error
    await expect(repository.vectorSearch(givenParams)).rejects.toThrow(
      "EntityEmbeddingRepository.vectorSearch: vectorSearch failed"
    );
    expect(console.error).toHaveBeenCalled();
  });
});
