import "_test_utilities/consoleMock";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { parseSkillToSkillRelationFromFile, parseSkillToSkillRelationFromUrl } from "./skillToSkillRelationParser";
import { SkillToSkillRelationRepository } from "esco/skillToSkillRelation/skillToSkillRelationRepository";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";

jest.mock("https");

const parseFromUrlCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  const mockResponse = fs.createReadStream(file);
  // @ts-ignore
  mockResponse.statusCode = StatusCodes.OK;
  (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
    callback(mockResponse);
    return {
      on: jest.fn(),
    };
  });
  return parseSkillToSkillRelationFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseSkillToSkillRelationFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseSkillToSkillRelation from", () => {
  beforeAll(() => {
    jest.spyOn(errorLogger, "logError");
    jest.spyOn(errorLogger, "logWarning");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["url file", "./src/import/esco/skillToSkillRelation/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/skillToSkillRelation/_test_data_/given.csv", parseFromFileCallback],
  ])("should create Skill To Skill Relation from %s for valid rows", async (description, file, parseCallBack) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND a SkillToSkillRelation repository
    const givenMockRepository: SkillToSkillRelationRepository = {
      relationModel: undefined as any,
      skillModel: undefined as any,
      findAll: jest.fn(),
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: INewSkillToSkillPairSpec[]): Promise<ISkillToSkillRelationPair[]> => {
            return Promise.resolve(
              specs.map((spec: INewSkillToSkillPairSpec): ISkillToSkillRelationPair => {
                return {
                  ...spec,
                  id: "DB_ID_",
                  modelId: modelId,
                  createdAt: new Date(),
                  requiredSkillDocModel: MongooseModelName.Skill,
                  requiringSkillDocModel: MongooseModelName.Skill,
                  updatedAt: new Date(),
                };
              })
            );
          }
        ),
    };

    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillToSkillRelation", "get").mockReturnValue(givenMockRepository);

    // AND all requiring/required CSV ids have already been imported and mapped to database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "get").mockImplementation((key) => {
      if (key === "") return undefined;
      else return "mapped_" + key;
    });

    // WHEN the data are parsed
    const actualStats = await parseCallBack(file, givenModelId, givenImportIdToDBIdMap);

    // THEN expect the repository to have been called with the expected spec
    const expectedResults: ISkillToSkillRelationPair[] = require("./_test_data_/expected.ts").expected;
    expectedResults.forEach((expectedResult: ISkillToSkillRelationPair) => {
      expect(givenMockRepository.createMany).toHaveBeenCalledWith(
        givenModelId,
        expect.arrayContaining([{ ...expectedResult }])
      );
    });
    // AND expect only the relation entries that have passed the transformation to have been processed successfully
    expect(actualStats).toEqual({
      rowsProcessed: expectedResults.length,
      rowsSuccess: expectedResults.length,
      rowsFailed: 0,
    });

    // AND no error should be logged
    expect(errorLogger.logError).not.toHaveBeenCalled();

    // AND warning should be logged for each of the failed rows
    expect(errorLogger.logWarning).toHaveBeenCalledTimes(6);
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      1,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'' and requiredSkillId:'key_5'`
    );
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      2,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'key_6' and requiredSkillId:''`
    );
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      3,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'' and requiredSkillId:'key_9'`
    );
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      4,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'key_10' and requiredSkillId:''`
    );
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      5,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'key_11' and requiredSkillId:'key_12'`
    );
    expect(errorLogger.logWarning).toHaveBeenNthCalledWith(
      6,
      `Failed to import SkillToSkillRelation row with requiringSkillId:'key_13' and requiredSkillId:'key_14'`
    );
  });
});
