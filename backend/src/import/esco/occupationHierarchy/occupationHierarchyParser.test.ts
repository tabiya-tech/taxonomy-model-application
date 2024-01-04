// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { OccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import { parseOccupationHierarchyFromFile, parseOccupationHierarchyFromUrl } from "./occupationHierarchyParser";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
} from "esco/occupationHierarchy/occupationHierarchy.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
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
  return parseOccupationHierarchyFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseOccupationHierarchyFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseOccupationHierarchy from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    ["url file", "./src/import/esco/occupationHierarchy/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/occupationHierarchy/_test_data_/given.csv", parseFromFileCallback],
  ])(
    "should create Occupation Hierarchy from %s for valid rows",
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
      // AND an OccupationHierarchy repository
      const givenMockRepository: OccupationHierarchyRepository = {
        iscoGroupModel: undefined as never,
        occupationModel: undefined as never,
        hierarchyModel: undefined as never,
        findAll: jest.fn(),
        createMany: jest
          .fn()
          .mockImplementation(
            (modelId: string, specs: INewOccupationHierarchyPairSpec[]): Promise<IOccupationHierarchyPair[]> => {
              return Promise.resolve(
                specs.map((spec: INewOccupationHierarchyPairSpec): IOccupationHierarchyPair => {
                  return {
                    ...spec,
                    id: "DB_ID_", // + spec.importId,
                    modelId: modelId,
                    childDocModel: MongooseModelName.ISCOGroup,
                    parentDocModel: MongooseModelName.Occupation,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                })
              );
            }
          ),
      };
      // @ts-ignore
      jest.spyOn(getRepositoryRegistry(), "occupationHierarchy", "get").mockReturnValue(givenMockRepository);
      // AND all child/parent CSV ids have already been imported and mapped to database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "get").mockImplementation((key) => {
        if (key === "")
          // empty string is not a valid import id and should be ignored to enable the test how they are handled
          return undefined;
        else return "mapped_" + key;
      });

      // WHEN the data are parsed
      const actualStats = await parseCallBack(givenCSVFile, givenModelId, givenImportIdToDBIdMap);

      // THEN expect the repository to have been called with the expected spec
      const path = "./_test_data_/expected.ts";
      const expectedResultsModule = await import(path);
      const expectedResults = expectedResultsModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewOccupationHierarchyPairSpec, "modelId">) => {
        expect(givenMockRepository.createMany).toHaveBeenCalledWith(
          givenModelId,
          expect.arrayContaining([{ ...expectedSpec }])
        );
      });
      // AND expect only the hierarchy entries that have passed the transformation to have been processed successfully
      const expectedCSVFileRowCount = countCSVRecords(givenCSVFile);
      expect(actualStats).toEqual({
        rowsProcessed: expectedCSVFileRowCount,
        rowsSuccess: expectedResults.length,
        rowsFailed: expectedCSVFileRowCount - expectedResults.length,
      });
      // AND no error should be logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      // AND warning should be logged fo reach of the failed rows
      expect(errorLogger.logWarning).toHaveBeenCalledTimes(5); // 5 entries are constructed in the csv to fail
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        1,
        `Failed to import OccupationHierarchy row with parentType:'LOCALOCCUPATION' and childType:'ISCOOCCUPATION'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        2,
        `Failed to import OccupationHierarchy row with parentType:'invalid should be ignored' and childType:'ESCOOCCUPATION'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        3,
        `Failed to import OccupationHierarchy row with parentType:'ISCOGROUP' and childType:'invalid should be ignored'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        4,
        `Failed to import OccupationHierarchy row with parent importId:'' and child importId:'key_23'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        5,
        `Failed to import OccupationHierarchy row with parent importId:'key_24' and child importId:''`
      );
    }
  );
});
