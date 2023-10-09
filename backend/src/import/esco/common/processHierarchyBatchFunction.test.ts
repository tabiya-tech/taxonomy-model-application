// mute console.log
import "_test_utilities/consoleMock";

import importLogger from "import/importLogger/importLogger";
import { getProcessHierarchyBatchFunction } from "./processHierarchyBatchFunction";

describe("test getProcessHierarchyBatchFunction", () => {
  beforeAll(() => {
    jest.spyOn(importLogger, "logError");
    jest.spyOn(importLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GIVEN and entity type that has an id property
  type GivenHierarchyEntity = { id: string };
  // AND a new specification type
  type GivenNewHierarchyEntitySpec = any;
  // AND a name for the entity
  const givenHierarchyEntityName = "foo-hierarchy-entity";

  // AND a repository for the hierarchy
  test("should create hierarchy entities from for all rows", async () => {
    // AND a model id
    const givenModelId = "foo-model-id";
    // AND a repository for the hierarchy
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: GivenNewHierarchyEntitySpec[]): Promise<GivenHierarchyEntity[]> => {
            return Promise.resolve(
              specs.map((spec: GivenNewHierarchyEntitySpec): GivenHierarchyEntity => {
                return {
                  ...spec,
                };
              })
            );
          }
        ),
    };
    // AND a batch with N rows that have valid hierarchy entities
    const givenBatch: GivenNewHierarchyEntitySpec[] = [{}, {}, {}, {}];

    // WHEN the getProcessHierarchyBatchFunction is created and called
    const processHierarchyBatchFunction = getProcessHierarchyBatchFunction<
      GivenHierarchyEntity,
      GivenNewHierarchyEntitySpec
    >(givenModelId, givenHierarchyEntityName, givenMockRepository);
    const actualStats = await processHierarchyBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);
    // AND all the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length,
      rowsFailed: 0,
    });
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND warning should be logged fo reach of the failed rows
    expect(importLogger.logWarning).not.toHaveBeenCalled();
    //
  });

  test("should log error and warnings when repository create fails", async () => {
    // AND a model id
    const givenModelId = "foo-model-id";
    // AND a repository that will fail to create the hierarchy entities
    const givenError = new Error("some error");
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest.fn().mockRejectedValueOnce(givenError),
    };

    // AND a batch with N rows that have valid hierarchy entities
    const givenBatch: GivenNewHierarchyEntitySpec[] = [{}, {}, {}, {}];

    // WHEN the processHierarchyEntityBatchFunction is created and called
    const processHierarchyEntityBatchFunction = getProcessHierarchyBatchFunction<
      GivenHierarchyEntity,
      GivenNewHierarchyEntitySpec
    >(givenModelId, givenHierarchyEntityName, givenMockRepository);
    const actualStats = await processHierarchyEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);

    // AND all the entities to have failed to be processed
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: 0,
      rowsFailed: givenBatch.length,
    });
    // AND an error should be logged for the failed repository call
    expect(importLogger.logError).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to process ${givenHierarchyEntityName}s batch`),
      givenError
    );
    // AND a warning should be logged
    expect(importLogger.logWarning).toHaveBeenCalledTimes(1);
    expect(importLogger.logWarning).toHaveBeenCalledWith(
      expect.stringContaining(
        `${givenBatch.length} of the ${givenHierarchyEntityName} entries could not be imported. Currently no further information is available.`
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
        .mockImplementation(
          (modelId: string, specs: GivenNewHierarchyEntitySpec[]): Promise<GivenHierarchyEntity[]> => {
            return Promise.resolve(
              specs
                .filter((v, i) => i % 2 === 1)
                .map((spec: GivenNewHierarchyEntitySpec): GivenHierarchyEntity => {
                  return {
                    ...spec,
                  };
                })
            );
          }
        ),
    };
    // AND a batch with N rows
    const givenBatch: GivenNewHierarchyEntitySpec[] = [{}, {}, {}, {}, {}, {}];

    // WHEN the processHierarchyEntityBatchFunction is created and called
    const processHierarchyEntityBatchFunction = getProcessHierarchyBatchFunction<
      GivenHierarchyEntity,
      GivenNewHierarchyEntitySpec
    >(givenModelId, givenHierarchyEntityName, givenMockRepository);
    const actualStats = await processHierarchyEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);

    // AND only half the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length - 3,
      rowsFailed: 3,
    });
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged that some specs could not be created
    expect(importLogger.logWarning).toHaveBeenCalledTimes(1);
    expect(importLogger.logWarning).toHaveBeenCalledWith(
      expect.stringContaining(
        `${3} of the ${givenHierarchyEntityName} entries could not be imported. Currently no further information is available.`
      )
    );
  });
});
