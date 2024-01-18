// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { parseISCOGroupsFromFile, parseISCOGroupsFromUrl } from "./ISCOGroupsParser";
import { IISCOGroupRepository } from "esco/iscoGroup/ISCOGroupRepository";
import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { isSpecified } from "server/isUnspecified";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { countCSVRecords } from "import/esco/_test_utilities/countCSVRecords";

jest.mock("https");

const parseFromUrlCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  const mockResponse = fs.createReadStream(file);
  // @ts-ignore
  mockResponse.statusCode = StatusCodes.OK; // Set the status code
  (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
    callback(mockResponse);
    return {
      on: jest.fn(),
    };
  });
  return parseISCOGroupsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseISCOGroupsFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseISCOGroups from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["url file", "./src/import/esco/ISCOGroups/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/ISCOGroups/_test_data_/given.csv", parseFromFileCallback],
  ])(
    "should create ISCOGroups from %s for rows with importId",
    async (
      description,
      givenCSVFile,
      parseCallBack: (
        file: string,
        givenModelId: string,
        importIdToDBIdMap: Map<string, string>
      ) => Promise<RowsProcessedStats>
    ) => {
      // GIVEN a model id
      const givenModelId = "foo-model-id";
      // AND an ISCOGroup repository
      const givenMockRepository: IISCOGroupRepository = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockImplementation((specs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> => {
          return Promise.resolve(
            specs.map((spec: INewISCOGroupSpec): IISCOGroup => {
              return {
                ...spec,
                id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                UUID: "",
                parent: null,
                children: [],
                updatedAt: new Date(),
                createdAt: new Date(),
              };
            })
          );
        }),
        findById: jest.fn().mockResolvedValue({}),
        findAll: jest.fn(),
      };
      jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(givenMockRepository);
      // AND a map to map the ids of the CSV givenCSVFile to the database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "set");

      // WHEN the data are parsed
      const actualStats = await parseCallBack(givenCSVFile, givenModelId, givenImportIdToDBIdMap);

      // THEN expect the repository to have been called with the expected spec
      const path = "./_test_data_/expected.ts";
      const expectedResultsModule = await import(path);
      const expectedResults = expectedResultsModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">) => {
        expect(givenMockRepository.createMany).toHaveBeenLastCalledWith(
          expect.arrayContaining([{ ...expectedSpec, modelId: givenModelId }])
        );
      });
      // AND all the expected rows to have been processed successfully
      const expectedCSVFileRowCount = countCSVRecords(givenCSVFile);
      expect(actualStats).toEqual({
        rowsProcessed: expectedCSVFileRowCount,
        rowsSuccess: expectedResults.length,
        rowsFailed: expectedCSVFileRowCount - expectedResults.length,
      });
      // AND the non-empty import ids to have been mapped to the db id
      expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(3);
      expectedResults
        .filter((res: Omit<INewISCOGroupSpec, "modelId">) => isSpecified(res.importId))
        .forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">, index: number) => {
          expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
            index + 1,
            expectedSpec.importId,
            "DB_ID_" + expectedSpec.importId
          );
        });
      // AND no error should be logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      // AND warning should be logged fo reach of the failed rows
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(1, "Failed to import ISCOGroup from row:1 with importId:");
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(2, "Failed to import ISCOGroup from row:2 with importId:");
    }
  );
});
