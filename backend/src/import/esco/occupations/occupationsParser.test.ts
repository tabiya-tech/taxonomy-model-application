// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { parseOccupationsFromFile, parseOccupationsFromUrl } from "./occupationsParser";
import { IOccupationRepository } from "esco/occupation/occupationRepository";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { INewOccupationSpec, IOccupation } from "esco/occupation/occupation.types";
import { isSpecified } from "server/isUnspecified";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { countCSVRecords } from "import/esco/_test_utilities/countCSVRecords";

jest.mock("https");

const parseFromUrlCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>,
  isLocalImport: boolean
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
  return parseOccupationsFromUrl(givenModelId, "someUrl", importIdToDBIdMap, isLocalImport);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>,
  isLocalImport: boolean
): Promise<RowsProcessedStats> => {
  return parseOccupationsFromFile(givenModelId, file, importIdToDBIdMap, isLocalImport);
};

describe("test parseOccupations from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    [
      "url file",
      true,
      "./src/import/esco/occupations/_test_data_/givenLocal.csv",
      "./_test_data_/expectedLocal.ts",
      parseFromUrlCallback,
    ],
    [
      "csv file",
      true,
      "./src/import/esco/occupations/_test_data_/givenLocal.csv",
      "./_test_data_/expectedLocal.ts",
      parseFromFileCallback,
    ],
    [
      "url file",
      false,
      "./src/import/esco/occupations/_test_data_/givenESCO.csv",
      "./_test_data_/expectedESCO.ts",
      parseFromUrlCallback,
    ],
    [
      "csv file",
      false,
      "./src/import/esco/occupations/_test_data_/givenESCO.csv",
      "./_test_data_/expectedESCO.ts",
      parseFromFileCallback,
    ],
  ])(
    "should create Occupations from %s for rows with importId and 'isLocalImport' %s",
    async (
      description,
      isLocalImport: boolean,
      givenCSVFile,
      expectedFile,
      parseCallBack: (
        file: string,
        givenModelId: string,
        importIdToDBIdMap: Map<string, string>,
        isLocalImport: boolean
      ) => Promise<RowsProcessedStats>
    ) => {
      // GIVEN a model id
      const givenModelId = "foo-model-id";
      // AND an Occupation repository
      const mockRepository: IOccupationRepository = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockImplementation((specs: INewOccupationSpec[]): Promise<IOccupation[]> => {
          return Promise.resolve(
            specs.map((spec: INewOccupationSpec): IOccupation => {
              return {
                ...spec,
                id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                UUID: "",
                parent: null,
                children: [],
                localized: null,
                requiresSkills: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            })
          );
        }),
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn(),
      };
      // @ts-ignore
      jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(mockRepository);
      // AND a map to map the ids of the CSV file to the database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "set");

      // WHEN the data are parsed
      const actualStats = await parseCallBack(givenCSVFile, givenModelId, givenImportIdToDBIdMap, isLocalImport);

      // THEN expect the repository to have been called with the expected spec
      const expectedFileModule = await import(expectedFile);
      const expectedResults = expectedFileModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">) => {
        expect(mockRepository.createMany).toHaveBeenLastCalledWith(
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
      expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(4);
      expectedResults
        .filter((res: Omit<INewOccupationSpec, "modelId">) => isSpecified(res.importId))
        .forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">, index: number) => {
          expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
            index + 1,
            expectedSpec.importId,
            "DB_ID_" + expectedSpec.importId
          );
        });
      // AND no error should be logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      // AND warning should be logged fo reach of the failed rows
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        1,
        "Failed to import Occupation row with id:''. OccupationType not found/invalid."
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        2,
        "Failed to import Occupation row with id:''. OccupationType not found/invalid."
      );
      if (isLocalImport) {
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          3,
          "Failed to import Local Occupation row with id:'key_3'. Code not valid."
        );
      } else {
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          3,
          "Failed to import ESCO Occupation row with id:'key_3'. Code not valid."
        );
      }
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        4,
        "Failed to import Occupation row with id:'key_4'. OccupationType not found/invalid."
      );

      if (isLocalImport) {
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          5,
          "Failed to import Local Occupation row with id:'key_5'. Code not valid."
        );
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          6,
          "Failed to import Local Occupation row with id:'key_6'. Not a local occupation."
        );
      } else {
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          5,
          "Failed to import ESCO Occupation row with id:'key_5'. Code not valid."
        );
        expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
          6,
          "Failed to import ESCO Occupation row with id:'key_6'. Not an ESCO occupation."
        );
      }
    }
  );
});
