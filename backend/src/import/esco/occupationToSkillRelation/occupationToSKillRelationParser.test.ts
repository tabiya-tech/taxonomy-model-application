import "_test_utilities/consoleMock";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import { StatusCodes } from "server/httpUtils";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import importLogger from "import/importLogger/importLogger";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  parseOccupationToSkillRelationFromFile,
  parseOccupationToSkillRelationFromUrl,
} from "./occupationToSkillRelationParser";
import { OccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import {
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

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
  return parseOccupationToSkillRelationFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
};

const parseFromFileCallback = (
  file: string,
  givenModelId: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> => {
  return parseOccupationToSkillRelationFromFile(givenModelId, file, importIdToDBIdMap);
};

describe("test parseOccupationToSkillRelation from", () => {
  beforeAll(() => {
    jest.spyOn(importLogger, "logError");
    jest.spyOn(importLogger, "logWarning");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["url file", "./src/import/esco/occupationToSkillRelation/_test_data_/given.csv", parseFromUrlCallback],
    ["csv file", "./src/import/esco/occupationToSkillRelation/_test_data_/given.csv", parseFromFileCallback],
  ])("should create Skill To Skill Relation from %s for valid rows", async (description, file, parseCallBack) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND a OccupationToSkillRelation repository
    const givenMockRepository: OccupationToSkillRelationRepository = {
      relationModel: undefined as any,
      skillModel: undefined as any,
      occupationModel: undefined as any,
      createMany: jest
        .fn()
        .mockImplementation(
          (modelId: string, specs: INewOccupationToSkillPairSpec[]): Promise<IOccupationToSkillRelationPair[]> => {
            return Promise.resolve(
              specs.map((spec: INewOccupationToSkillPairSpec): IOccupationToSkillRelationPair => {
                return {
                  ...spec,
                  id: "DB_ID_",
                  modelId: modelId,
                  createdAt: new Date(),
                  requiringOccupationDocModel: MongooseModelName.Occupation,
                  requiredSkillDocModel: MongooseModelName.Skill,
                  updatedAt: new Date(),
                };
              })
            );
          }
        ),
    };

    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get").mockReturnValue(givenMockRepository);

    // AND all requiring/required CSV ids have already been imported and mapped to database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "get").mockImplementation((key) => {
      if (key === "") return undefined;
      else return "mapped_" + key;
    });

    // WHEN the data are parsed
    const actualStats = await parseCallBack(file, givenModelId, givenImportIdToDBIdMap);

    // THEN expect the repository to have been called with the expected spec
    const expectedResults: IOccupationToSkillRelationPair[] = require("./_test_data_/expected.ts").expected;
    expectedResults.forEach((expectedResult: IOccupationToSkillRelationPair) => {
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
    expect(importLogger.logError).not.toHaveBeenCalled();

    // AND warning should be logged for each of the failed rows
    expect(importLogger.logWarning).toHaveBeenCalledTimes(6);
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      1,
      `Failed to import OccupationToSkillRelation row with occupationId:'' and skillId:'key_5'.`
    );
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      2,
      `Failed to import OccupationToSkillRelation row with occupationId:'key_6' and skillId:''.`
    );
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      3,
      `Failed to import OccupationToSkillRelation row with occupationId:'key_9' and skillId:'key_10'.`
    );
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      4,
      `Failed to import OccupationToSkillRelation row with occupationId:'key_11' and skillId:'key_12'.`
    );
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      5,
      `Failed to import OccupationToSkillRelation row with occupationId:'key_13' and skillId:'key_14'.`
    );
    expect(importLogger.logWarning).toHaveBeenNthCalledWith(
      6,
      `Failed to import OccupationToSkillRelation row with occupationId:'key_15' and skillId:'key_16'.`
    );
  });
});