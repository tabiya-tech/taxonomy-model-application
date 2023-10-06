// mute console.log
import "_test_utilities/consoleMock";

import importLogger from "import/importLogger/importLogger";
import { ImportIdentifiable } from "esco/common/objectTypes";
import { getProcessEntityBatchFunction } from "./processEntityBatchFunction";

describe("test getProcessEntityBatchFunction", () => {
  beforeAll(() => {
    jest.spyOn(importLogger, "logError");
    jest.spyOn(importLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GIVEN and entity type that extends ImportIdentifiable and has an id property
  type GivenEntity = ImportIdentifiable & { id: string };
  // AND a new specification type that extends  ImportIdentifiable
  type GivenNewEntitySpec = ImportIdentifiable;
  // AND a name for the entity
  const givenEntityName = "foo-entity";

  // AND a repository for the entity
  test("should create entities from for rows with importId", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the entity
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (specs: GivenNewEntitySpec[]): Promise<GivenEntity[]> => {
            return Promise.resolve(
              specs.map((spec: GivenNewEntitySpec): GivenEntity => {
                return {
                  ...spec,
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a batch with N rows that have an import id
    const givenBatch: GivenNewEntitySpec[] = [
      { importId: "1" },
      { importId: "2" },
      { importId: "3" },
      { importId: "4" },
    ];

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessEntityBatchFunction<
      GivenEntity,
      GivenNewEntitySpec
    >(givenEntityName, givenMockRepository, givenImportIdToDBIdMap);
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenBatch);
    // AND all the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length,
      rowsFailed: 0,
    });
    // AND the import ids to have been mapped to the db id
    expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(givenBatch.length);
    givenBatch.forEach((givenSpec, index: number) => {
      expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
        index + 1,
        givenSpec.importId,
        "DB_ID_" + givenSpec.importId
      );
    });
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND warning should be logged fo reach of the failed rows
    expect(importLogger.logWarning).not.toHaveBeenCalled();
    //
  });

  test("should create entities from for rows with importId and log warnings for rows without importId", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the entity
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (specs: GivenNewEntitySpec[]): Promise<GivenEntity[]> => {
            return Promise.resolve(
              specs.map((spec: GivenNewEntitySpec): GivenEntity => {
                return {
                  ...spec,
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a batch with N rows where every odd has an import id and every odd does not have an import id
    const givenBatch: GivenNewEntitySpec[] = [
      { importId: "1" },
      // @ts-ignore
      { importId: null },
      { importId: "3" },
      // @ts-ignore
      { importId: undefined },
      { importId: "5" },
      // @ts-ignore
      {},
      { importId: "7" },
      { importId: "" },
    ];

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessEntityBatchFunction<
      GivenEntity,
      GivenNewEntitySpec
    >(givenEntityName, givenMockRepository, givenImportIdToDBIdMap);
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, only for the specs with an importId
    expect(givenMockRepository.createMany).toHaveBeenCalledWith([
      givenBatch[0],
      givenBatch[2],
      givenBatch[4],
      givenBatch[6],
    ]);
    // AND expect all the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length - 4,
      rowsFailed: 4,
    });
    // AND the import ids to have been mapped to the db id
    expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(4);
    [givenBatch[0], givenBatch[2], givenBatch[4]].forEach(
      (givenSpec, index: number) => {
        expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          givenSpec.importId,
          "DB_ID_" + givenSpec.importId
        );
      }
    );
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged for each spec without an importId
    expect(importLogger.logWarning).toHaveBeenCalledTimes(4);
    [givenBatch[1], givenBatch[3], givenBatch[5], givenBatch[7]].forEach(
      (givenSpec, index: number) => {
        expect(importLogger.logWarning).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringContaining(
            `Failed to import ${givenEntityName} from row:${
              2 * (index + 1)
            } with importId:`
          )
        );
      }
    );
  });

  test("should log warnings with correct row number", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the entity
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (specs: GivenNewEntitySpec[]): Promise<GivenEntity[]> => {
            return Promise.resolve(
              specs.map((spec: GivenNewEntitySpec): GivenEntity => {
                return {
                  ...spec,
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a First batch with rows that have an import id
    const givenFirstBatch: GivenNewEntitySpec[] = [
      { importId: "1" },
      { importId: "2" },
    ];

    // AND a second batch with a rows that not have an import id
    const givenSecondBatch: GivenNewEntitySpec[] = [
      // @ts-ignore
      { importId: null },
      // @ts-ignore
      { importId: undefined },
      { importId: "" },
      // @ts-ignore
      {},
    ];

    // AND the processEntityBatchFunction has been created and called once with the first batch
    const processEntityBatchFunction = getProcessEntityBatchFunction<
      GivenEntity,
      GivenNewEntitySpec
    >(givenEntityName, givenMockRepository, givenImportIdToDBIdMap);
    await processEntityBatchFunction(givenFirstBatch);

    // WHEN the processEntityBatchFunction is called with the second batch ( that has the rows that do not have an import id)
    const actualStats = await processEntityBatchFunction(givenSecondBatch);

    // THEN expect the stats to refer to the second batch
    expect(actualStats).toEqual({
      rowsProcessed: givenSecondBatch.length,
      rowsSuccess: 0,
      rowsFailed: givenSecondBatch.length,
    });

    // AND a warning should be logged for each spec without an importId
    expect(importLogger.logWarning).toHaveBeenCalledTimes(
      givenSecondBatch.length
    );
    // AND the warning should contain the correct row number
    givenSecondBatch.forEach((givenSpec, index: number) => {
      expect(importLogger.logWarning).toHaveBeenNthCalledWith(
        index + 1,
        expect.stringContaining(
          `Failed to import ${givenEntityName} from row:${
            givenFirstBatch.length + index + 1
          } with importId:`
        )
      );
    });
  });

  test("should log error and warnings when repository create fails", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository that will fail to create the entities
    const givenError = new Error("some error");
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest.fn().mockRejectedValueOnce(givenError),
    };

    // AND a batch with N rows that have an import id
    const givenBatch: GivenNewEntitySpec[] = [
      { importId: "1" },
      { importId: "2" },
      { importId: "3" },
      { importId: "4" },
    ];

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessEntityBatchFunction<
      GivenEntity,
      GivenNewEntitySpec
    >(givenEntityName, givenMockRepository, givenImportIdToDBIdMap);
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenBatch);

    // AND all the entities to have failed to be processed
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: 0,
      rowsFailed: givenBatch.length,
    });
    // AND an error should be logged for the failed repository call
    expect(importLogger.logError).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to process ${givenEntityName}s batch`),
      givenError
    );
    // AND a warning should be logged for each row
    for (let i = 1; i <= givenBatch.length; i++) {
      expect(importLogger.logWarning).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(
          `Failed to import ${givenEntityName} from row:${i} with importId:${i}`
        )
      );
    }
  });

  test("should log warnings when repository does create some of the batch entries", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the entity that will fail to create every ODD entity
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (specs: GivenNewEntitySpec[]): Promise<GivenEntity[]> => {
            return Promise.resolve(
              specs
                .filter((v, i) => i % 2 === 1)
                .map((spec: GivenNewEntitySpec): GivenEntity => {
                  return {
                    ...spec,
                    id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                  };
                })
            );
          }
        ),
    };
    // AND a batch with N rows
    const givenBatch: GivenNewEntitySpec[] = [
      { importId: "1" },
      { importId: "2" },
      { importId: "3" },
      { importId: "4" },
      { importId: "5" },
      { importId: "6" },
    ];

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessEntityBatchFunction<
      GivenEntity,
      GivenNewEntitySpec
    >(givenEntityName, givenMockRepository, givenImportIdToDBIdMap);
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs with an importId
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenBatch);

    // AND only half the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length - 3,
      rowsFailed: 3,
    });
    // AND no error should be logged
    expect(importLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged for each spec that could not be created
    expect(importLogger.logWarning).toHaveBeenCalledTimes(3);
    [givenBatch[1], givenBatch[3], givenBatch[5]].forEach(
      (givenSpec, index: number) => {
        expect(importLogger.logWarning).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringContaining(
            `Failed to import ${givenEntityName} from row:${
              2 * index + 1
            } with importId:`
          )
        );
      }
    );
  });
});
