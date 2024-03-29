// mute console.log
import "_test_utilities/consoleMock";

import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "./processRelationBatchFunction";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("test getProcessRelationBatchFunction", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GIVEN and entity type that has an id property
  type GivenRelationEntity = { id: string };
  // AND a new specification type
  type GivenNewRelationEntitySpec = object;
  // AND a name for the entity
  const givenRelationEntityName = "foo-Relation-entity";

  // AND a repository for the Relation
  test("should create Relation entities from for all rows", async () => {
    // AND a model id
    const givenModelId = "foo-model-id";
    // AND a repository for the Relation
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation((_modelId: string, specs: GivenNewRelationEntitySpec[]): Promise<GivenRelationEntity[]> => {
          return Promise.resolve(
            specs.map((spec: GivenNewRelationEntitySpec, index): GivenRelationEntity => {
              return {
                id: getMockStringId(index),
                ...spec,
              };
            })
          );
        }),
    };
    // AND a batch with N rows that have valid Relation entities
    const givenBatch: GivenNewRelationEntitySpec[] = [{}, {}, {}, {}];

    // WHEN the getProcessRelationBatchFunction is created and called
    const processRelationBatchFunction = getRelationBatchFunction<GivenRelationEntity, GivenNewRelationEntitySpec>(
      givenModelId,
      givenRelationEntityName,
      givenMockRepository
    );
    const actualStats = await processRelationBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);
    // AND all the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length,
      rowsFailed: 0,
    });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND warning should be logged fo reach of the failed rows
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
    //
  });

  test("should log error and warnings when repository create fails", async () => {
    // AND a model id
    const givenModelId = "foo-model-id";
    // AND a repository that will fail to create the Relation entities
    const givenError = new Error("some error");
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest.fn().mockRejectedValueOnce(givenError),
    };

    // AND a batch with N rows that have valid Relation entities
    const givenBatch: GivenNewRelationEntitySpec[] = [{}, {}, {}, {}];

    // WHEN the processRelationEntityBatchFunction is created and called
    const processRelationEntityBatchFunction = getRelationBatchFunction<
      GivenRelationEntity,
      GivenNewRelationEntitySpec
    >(givenModelId, givenRelationEntityName, givenMockRepository);
    const actualStats = await processRelationEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);

    // AND all the entities to have failed to be processed
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: 0,
      rowsFailed: givenBatch.length,
    });
    // AND an error should be logged for the failed repository call
    expect(errorLogger.logError).toHaveBeenCalledWith(
      expect.toMatchErrorWithCause(`Failed to process ${givenRelationEntityName}s batch`, givenError.message)
    );
    // AND a warning should be logged
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(1);
    expect(errorLogger.logWarning).toHaveBeenCalledWith(
      expect.stringContaining(
        `${givenBatch.length} of the ${givenRelationEntityName} entries could not be imported. Currently no further information is available.`
      )
    );
  });

  test("should log warnings when repository does create some of the batch entries", async () => {
    // AND a model id
    const givenModelId = "foo-model-id";
    // AND a repository for the entity that will fail to create every ODD entity
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation((_modelId: string, specs: GivenNewRelationEntitySpec[]): Promise<GivenRelationEntity[]> => {
          return Promise.resolve(
            specs
              .filter((_v, i) => i % 2 === 1)
              .map((spec: GivenNewRelationEntitySpec, index): GivenRelationEntity => {
                return {
                  id: getMockStringId(index),
                  ...spec,
                };
              })
          );
        }),
    };
    // AND a batch with N rows
    const givenBatch: GivenNewRelationEntitySpec[] = [{}, {}, {}, {}, {}, {}];

    // WHEN the processRelationEntityBatchFunction is created and called
    const processRelationEntityBatchFunction = getRelationBatchFunction<
      GivenRelationEntity,
      GivenNewRelationEntitySpec
    >(givenModelId, givenRelationEntityName, givenMockRepository);
    const actualStats = await processRelationEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);

    // AND only half the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length - 3,
      rowsFailed: 3,
    });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged that some specs could not be created
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(1);
    expect(errorLogger.logWarning).toHaveBeenCalledWith(
      expect.stringContaining(
        `${3} of the ${givenRelationEntityName} entries could not be imported. Currently no further information is available.`
      )
    );
  });
});
