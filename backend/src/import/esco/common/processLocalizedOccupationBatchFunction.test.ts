// mute console.log
import "_test_utilities/consoleMock";

import errorLogger from "common/errorLogger/errorLogger";
import { getProcessLocalizedOccupationEntityBatchFunction } from "./processLocalizedOccupationBatchFunction";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ILocalizedOccupation, INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";
import { randomUUID } from "crypto";
import { getSimpleNewLocalizedOccupationSpec } from "esco/_test_utilities/getNewSpecs";

describe("test getProcessEntityBatchFunction", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GIVEN a modelId
  const givenModelId = getMockStringId(1);
  test("should create entities from for rows with importId", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the localized occupations
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: INewLocalizedOccupationSpec[]): Promise<ILocalizedOccupation[]> => {
            return Promise.resolve(
              specs.map((spec: INewLocalizedOccupationSpec): ILocalizedOccupation => {
                return {
                  ...spec,
                  UUID: randomUUID(),
                  updatedAt: new Date(),
                  createdAt: new Date(),
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a batch with N rows that have an import id
    const givenBatch: INewLocalizedOccupationSpec[] = Array.from({ length: 4 }, (_v, i) => {
      return getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(i));
    });

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessLocalizedOccupationEntityBatchFunction(
      givenModelId,
      givenMockRepository,
      givenImportIdToDBIdMap
    );
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);
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
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND warning should be logged fo reach of the failed rows
    expect(errorLogger.logWarning).not.toHaveBeenCalled();
    //
  });

  test("should create entities from for rows with importId and log warnings for rows without importId", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the localized occupations
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: INewLocalizedOccupationSpec[]): Promise<ILocalizedOccupation[]> => {
            return Promise.resolve(
              specs.map((spec: INewLocalizedOccupationSpec): ILocalizedOccupation => {
                return {
                  ...spec,
                  UUID: randomUUID(),
                  updatedAt: new Date(),
                  createdAt: new Date(),
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a batch with N rows that have an import id
    // @ts-ignore
    const givenBatch: INewLocalizedOccupationSpec[] = [
      getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(0)),
      // @ts-ignore
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(1)), importId: null },
      getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(2)),
      // @ts-ignore
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(3)), importId: undefined },
      getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(4)),
      // @ts-ignore
      {},
      getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(5)),
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(6)), importId: "" },
    ];

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessLocalizedOccupationEntityBatchFunction(
      givenModelId,
      givenMockRepository,
      givenImportIdToDBIdMap
    );
    const actualStats = await processEntityBatchFunction(givenBatch);
    // THEN expect the repository to have been called with the correct spec, only for the specs with an importId

    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, [
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
    [givenBatch[0], givenBatch[2], givenBatch[4]].forEach((givenSpec, index: number) => {
      expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
        index + 1,
        givenSpec.importId,
        "DB_ID_" + givenSpec.importId
      );
    });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged for each spec without an importId
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(4);
    [givenBatch[1], givenBatch[3], givenBatch[5], givenBatch[7]].forEach((givenSpec, index: number) => {
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        index + 1,
        expect.stringContaining(`Failed to import Occupation from row:${2 * (index + 1)} with importId:`)
      );
    });
  });

  test("should log warnings with correct row number", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the localized occupations
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: INewLocalizedOccupationSpec[]): Promise<ILocalizedOccupation[]> => {
            return Promise.resolve(
              specs.map((spec: INewLocalizedOccupationSpec): ILocalizedOccupation => {
                return {
                  ...spec,
                  UUID: randomUUID(),
                  updatedAt: new Date(),
                  createdAt: new Date(),
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                };
              })
            );
          }
        ),
    };
    // AND a First batch with rows that have an import id
    const givenFirstBatch: INewLocalizedOccupationSpec[] = Array.from({ length: 2 }, (_v, i) => {
      return getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(i));
    });

    // AND a second batch with a rows that do not have an import id
    const givenSecondBatch: INewLocalizedOccupationSpec[] = [
      // @ts-ignore
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(1)), importId: null },
      // @ts-ignore
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(2)), importId: undefined },
      { ...getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(3)), importId: "" },
      // @ts-ignore
      {},
    ];

    // AND the processEntityBatchFunction has been created and called once with the first batch
    const processEntityBatchFunction = getProcessLocalizedOccupationEntityBatchFunction(
      givenModelId,
      givenMockRepository,
      givenImportIdToDBIdMap
    );
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
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(givenSecondBatch.length);
    // AND the warning should contain the correct row number
    givenSecondBatch.forEach((givenSpec, index: number) => {
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        index + 1,
        expect.stringContaining(
          `Failed to import Occupation from row:${givenFirstBatch.length + index + 1} with importId:`
        )
      );
    });
  });

  test("should log error and warnings when repository create fails", async () => {
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set");
    // AND a repository for the localized occupations that will fail to create the entities
    const givenError = new Error("some error");
    const givenMockRepository = {
      // @ts-ignore
      createMany: jest.fn().mockRejectedValueOnce(givenError),
    };
    // AND a batch with N rows that have an import id
    const givenBatch: INewLocalizedOccupationSpec[] = Array.from({ length: 4 }, (_v, i) => {
      return getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(i));
    });

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessLocalizedOccupationEntityBatchFunction(
      givenModelId,
      givenMockRepository,
      givenImportIdToDBIdMap
    );
    const actualStats = await processEntityBatchFunction(givenBatch);

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
      expect.stringContaining(`Failed to process Occupations batch`),
      givenError
    );
    // AND a warning should be logged for each row
    for (let i = 1; i <= givenBatch.length; i++) {
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(`Failed to import Occupation from row:${i} with importId:${givenBatch[i - 1].importId}`)
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
          (modelId: string, specs: INewLocalizedOccupationSpec[]): Promise<ILocalizedOccupation[]> => {
            return Promise.resolve(
              specs
                .filter((v, i) => i % 2 === 1)
                .map((spec: INewLocalizedOccupationSpec): ILocalizedOccupation => {
                  return {
                    ...spec,
                    UUID: randomUUID(),
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                  };
                })
            );
          }
        ),
    };
    // AND a batch with N rows
    const givenBatch: INewLocalizedOccupationSpec[] = Array.from({ length: 6 }, (_v, i) => {
      return getSimpleNewLocalizedOccupationSpec(givenModelId, getMockStringId(i));
    });

    // WHEN the processEntityBatchFunction is created and called
    const processEntityBatchFunction = getProcessLocalizedOccupationEntityBatchFunction(
      givenModelId,
      givenMockRepository,
      givenImportIdToDBIdMap
    );
    const actualStats = await processEntityBatchFunction(givenBatch);

    // THEN expect the repository to have been called with the correct spec, for all the specs with an importId
    expect(givenMockRepository.createMany).toHaveBeenCalledWith(givenModelId, givenBatch);

    // AND only half the entities to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: givenBatch.length,
      rowsSuccess: givenBatch.length - 3,
      rowsFailed: 3,
    });
    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();
    // AND a warning should be logged for each spec that could not be created
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(3);
    [givenBatch[1], givenBatch[3], givenBatch[5]].forEach((givenSpec, index: number) => {
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        index + 1,
        expect.stringContaining(`Failed to import Occupation from row:${2 * index + 1} with importId:`)
      );
    });
  });
});
