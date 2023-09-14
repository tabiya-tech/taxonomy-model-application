// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {
  parseSkillsFromFile,
  parseSkillsFromUrl
} from "./skillsParser";
import {ISkillRepository} from "esco/skill/SkillRepository";
import {INewSkillSpec, ISkill} from "esco/skill/skills.types";
import {isSpecified} from "server/isUnspecified";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

jest.mock('https');

describe("test parseSkills from", () => {
  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      const mockResponse = fs.createReadStream("./src/import/esco/skills/_test_data_/given.csv");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      return parseSkillsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
    }],
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      return parseSkillsFromFile(givenModelId, "./src/import/esco/skills/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create Skills from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<RowsProcessedStats>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND a Skill repository
    const givenMockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockImplementation((specs: INewSkillSpec[]): Promise<ISkill[]> => {
        return Promise.resolve(specs.map((spec: INewSkillSpec): ISkill => {
          return {
            ...spec,
            id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
            UUID: "",
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }));
      }),
    };
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenMockRepository);
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set")

    // WHEN the data are parsed
    const actualStats = await parseCallBack(givenModelId, givenImportIdToDBIdMap);

    // THEN expect all the occupations to have been processed successfully
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualStats).toEqual({
      rowsProcessed: expectedResults.length,
      rowsSuccess: expectedResults.length,
      rowsFailed: 0
    });
    // AND the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">) => {
      expect(givenMockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
    // AND the non-empty import ids to have been mapped to the db id
    expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(2);
    expectedResults
      .filter((res: Omit<INewSkillSpec, "modelId">) => isSpecified(res.importId))
      .forEach((expectedSpec: Omit<INewSkillSpec, "modelId">, index: number) => {
        expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          expectedSpec.importId,
          "DB_ID_" + expectedSpec.importId
        )
      });
  })
});