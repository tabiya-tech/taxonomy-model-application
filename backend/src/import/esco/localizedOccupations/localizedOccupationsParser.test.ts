// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ILocalizedOccupationRepository } from "esco/localizedOccupation/localizedOccupationRepository";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { parseLocalizedOccupationsFromFile, parseLocalizedOccupationsFromUrl } from "./localizedOccupationsParser";
import {
  IExtendedLocalizedOccupation,
  INewLocalizedOccupationSpec,
} from "esco/localizedOccupation/localizedOccupation.types";
import { isSpecified } from "server/isUnspecified";
import { OccupationType } from "esco/common/objectTypes";

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
  return parseLocalizedOccupationsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseLocalizedOccupationsFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseLocalizedOccupations from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    ["url file", "./src/import/esco/localizedOccupations/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/localizedOccupations/_test_data_/given.csv", parseFromFileCallback],
  ])(
    "should create localizedOccupations from %s for rows with importId",
    async (
      description,
      file,
      parseCallBack: (
        file: string,
        givenModelId: string,
        importIdToDBIdMap: Map<string, string>
      ) => Promise<RowsProcessedStats>
    ) => {
      // GIVEN a model id
      const givenModelId = "foo-model-id";
      // AND a Localized Occupation repository
      const givenMockRepository: ILocalizedOccupationRepository = {
        Model: undefined as never,
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
        createMany: jest
          .fn()
          .mockImplementation((specs: INewLocalizedOccupationSpec[]): Promise<IExtendedLocalizedOccupation[]> => {
            return Promise.resolve(
              specs.map((spec: INewLocalizedOccupationSpec): IExtendedLocalizedOccupation => {
                return {
                  ...spec,
                  id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                  children: [],
                  modelId: "",
                  preferredLabel: "",
                  UUIDHistory: [],
                  ESCOUri: "",
                  ISCOGroupCode: "",
                  code: "",
                  altLabels: [],
                  description: "",
                  definition: "",
                  scopeNote: "",
                  regulatedProfessionNote: "",
                  occupationType: OccupationType.LOCALIZED,
                  localizedOccupationType: OccupationType.ESCO,
                  parent: null,
                  requiresSkills: [],
                  updatedAt: new Date(),
                  createdAt: new Date(),
                  UUID: "",
                };
              })
            );
          }),
      };
      jest.spyOn(getRepositoryRegistry(), "localizedOccupation", "get").mockReturnValue(givenMockRepository);
      // AND a map to map the ids of the CSV file to the database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "get").mockImplementation((key) => {
        if (key === "")
          // empty string is not a valid import id and should be ignored to enable the test how they are handled
          return undefined;
        else return "mapped_" + key;
      });
      jest.spyOn(givenImportIdToDBIdMap, "set");

      // WHEN the data are parsed
      const actualStats = await parseCallBack(file, givenModelId, givenImportIdToDBIdMap);

      // THEN expect the repository to have been called with the expected spec
      const path = "./_test_data_/expected.ts";
      const expectedResultsModule = await import(path);
      const expectedResults = expectedResultsModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewLocalizedOccupationSpec, "modelId">) => {
        expect(givenMockRepository.createMany).toHaveBeenCalledWith(
          expect.arrayContaining([{ ...expectedSpec, modelId: givenModelId }])
        );
      });
      // AND all the expected rows to have been processed successfully
      expect(actualStats).toEqual({
        rowsProcessed: 7,
        rowsSuccess: expectedResults.length,
        rowsFailed: 7 - expectedResults.length,
      });

      expectedResults
        .filter((res: Omit<INewLocalizedOccupationSpec, "modelId">) => isSpecified(res.importId))
        .forEach((expectedSpec: Omit<INewLocalizedOccupationSpec, "modelId">, index: number) => {
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
        "Failed to import Localized Occupation row with id:'key_4'. OccupationType not found/invalid."
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        2,
        "Failed to import Localized Occupation row with id:'key_5'. OccupationType not found/invalid."
      );
    }
  );
});
