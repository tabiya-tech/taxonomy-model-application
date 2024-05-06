// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { parseSkillsFromFile, parseSkillsFromUrl } from "./skillsParser";
import { ISkillRepository } from "esco/skill/skillRepository";
import { INewSkillSpec, ISkill } from "esco/skill/skills.types";
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
  return parseSkillsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseSkillsFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseSkills from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    ["url file", "./src/import/esco/skills/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/skills/_test_data_/given.csv", parseFromFileCallback],
  ])(
    "should create Skills from %s for rows with importId",
    async (
      description,
      givenCSVFile,
      parseCallBack: (
        givenCSVFile: string,
        givenModelId: string,
        importIdToDBIdMap: Map<string, string>
      ) => Promise<RowsProcessedStats>
    ) => {
      // GIVEN a model id
      const givenModelId = "foo-model-id";
      // AND a Skill repository
      const givenMockRepository: ISkillRepository = {
        // @ts-ignore
        Model: undefined,
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockImplementation((specs: INewSkillSpec[]): Promise<ISkill[]> => {
          return Promise.resolve(
            specs.map((spec: INewSkillSpec): ISkill => {
              return {
                ...spec,
                id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
                UUID: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                children: [],
                parents: [],
                requiresSkills: [],
                requiredBySkills: [],
                requiredByOccupations: [],
              };
            })
          );
        }),
      };
      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenMockRepository);
      // AND a map to map the ids of the CSV file to the database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "set");

      // WHEN the data are parsed
      const actualStats = await parseCallBack(givenCSVFile, givenModelId, givenImportIdToDBIdMap);

      // THEN expect the repository to have been called with the expected spec
      const path = "./_test_data_/expected.ts";
      const expectedResultsModule = await import(path);
      const expectedResults = expectedResultsModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">) => {
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
      expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(6);
      expectedResults
        .filter((res: Omit<INewSkillSpec, "modelId">) => isSpecified(res.importId))
        .forEach((expectedSpec: Omit<INewSkillSpec, "modelId">, index: number) => {
          expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
            index + 1,
            expectedSpec.importId,
            "DB_ID_" + expectedSpec.importId
          );
        });
      // AND no error should be logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      // AND a warning should be logged for the row with duplicate altLabels
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        3,
        "Warning while importing Skill row with id:'key_8'. AltLabels contain 1 duplicates."
      );
      // AND warning should be logged fo reach of the failed rows
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(1, "Failed to import Skill with skillId:key_6");
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(2, "Failed to import Skill with skillId:key_7");
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(4, "Failed to import Skill from row:1 with importId:");
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(5, "Failed to import Skill from row:2 with importId:");
    }
  );
});
