// mute console.log
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { SkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import { parseSkillHierarchyFromFile, parseSkillHierarchyFromUrl } from "./skillHierarchyParser";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import errorLogger from "common/errorLogger/errorLogger";

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
  return parseSkillHierarchyFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseSkillHierarchyFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseSkillHierarchy from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    ["url file", "./src/import/esco/skillHierarchy/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/skillHierarchy/_test_data_/given.csv", parseFromFileCallback],
  ])(
    "should create Skill Hierarchy from %s for valid rows",
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
      // AND an SkillHierarchy repository
      const givenMockRepository: SkillHierarchyRepository = {
        skillModel: undefined as never,
        hierarchyModel: undefined as never,
        skillGroupModel: undefined as never,
        findAll: jest.fn(),
        createMany: jest
          .fn()
          .mockImplementation(
            (modelId: string, specs: INewSkillHierarchyPairSpec[]): Promise<ISkillHierarchyPair[]> => {
              return Promise.resolve(
                specs.map((spec: INewSkillHierarchyPairSpec): ISkillHierarchyPair => {
                  return {
                    ...spec,
                    id: "DB_ID_", // + spec.importId,
                    modelId: modelId,
                    childDocModel: MongooseModelName.SkillGroup,
                    parentDocModel: MongooseModelName.Skill,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                })
              );
            }
          ),
      };
      // @ts-ignore
      jest.spyOn(getRepositoryRegistry(), "skillHierarchy", "get").mockReturnValue(givenMockRepository);
      // AND all child/parent CSV ids have already been imported and mapped to database ids
      const givenImportIdToDBIdMap = new Map<string, string>();
      jest.spyOn(givenImportIdToDBIdMap, "get").mockImplementation((key) => {
        if (key === "")
          // empty string is not a valid import id and should be ignored to enable the test how they are handled
          return undefined;
        else return "mapped_" + key;
      });

      // WHEN the data are parsed
      const actualStats = await parseCallBack(file, givenModelId, givenImportIdToDBIdMap);

      // THEN expect the repository to have been called with the expected spec
      const path = "./_test_data_/expected.ts";
      const expectedResultsModule = await import(path);
      const expectedResults = expectedResultsModule.expected;
      expectedResults.forEach((expectedSpec: Omit<INewSkillHierarchyPairSpec, "modelId">) => {
        expect(givenMockRepository.createMany).toHaveBeenCalledWith(
          givenModelId,
          expect.arrayContaining([{ ...expectedSpec }])
        );
      });
      // AND expect only the hierarchy entries that have passed the transformation to have been processed successfully
      expect(actualStats).toEqual({
        rowsProcessed: expectedResults.length,
        rowsSuccess: expectedResults.length,
        rowsFailed: 0,
      });
      // AND no error should be logged
      expect(errorLogger.logError).not.toHaveBeenCalled();
      // AND warning should be logged fo reach of the failed rows
      expect(errorLogger.logWarning).toHaveBeenCalledTimes(4); // 4 entries are constructed in the csv to fail
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        1,
        `Failed to import SkillHierarchy row with parentType:'invalid should be ignored' and childType:'Skill'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        2,
        `Failed to import SkillHierarchy row with parentType:'SkillGroup' and childType:'invalid should be ignored'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        3,
        `Failed to import SkillHierarchy row with parent importId:'' and child importId:'key_11'`
      );
      expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
        4,
        `Failed to import SkillHierarchy row with parent importId:'key_12' and child importId:''`
      );
    }
  );
});
