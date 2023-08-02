// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  parseSkillGroupsFromFile,
  parseSkillGroupsFromUrl
} from "./skillGroupsParser";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {ISkillGroupRepository} from "esco/skillGroup/SkillGroupRepository";
import {INewSkillGroupSpec, ISkillGroup} from "esco/skillGroup/skillGroup.types";
import {isSpecified} from "server/isUnspecified";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

jest.mock('https');

describe("test parseSkillGroups from", () => {

  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      const mockResponse = fs.createReadStream("./src/import/esco/skillGroups/_test_data_/given.csv");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      return parseSkillGroupsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
    }],
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      return parseSkillGroupsFromFile(givenModelId, "./src/import/esco/skillGroups/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create SkillGroups from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<RowsProcessedStats>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND a SkillGroup repository
    const givenMockRepository: ISkillGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockImplementation((specs: INewSkillGroupSpec[]): Promise<ISkillGroup[]> => {
        return Promise.resolve(specs.map((spec: INewSkillGroupSpec): ISkillGroup => {
          return {
            ...spec,
            id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
            UUID: "",
            parentGroups: [],
            childrenGroups: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }));
      }),
    };
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(givenMockRepository);
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set")

    // WHEN the data are parsed
    const actualStats = await parseCallBack(givenModelId, givenImportIdToDBIdMap);

    // THEN expect all the SkillGroups to have been processed successfully
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualStats).toEqual({
      rowsProcessed: expectedResults.length,
      rowsSuccess: expectedResults.length,
      rowsFailed: 0
    });
    // AND the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">) => {
      expect(givenMockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
    // AND the non-empty import ids to have been mapped to the db id
    expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(2);

    expectedResults
      .filter((res: Omit<INewSkillGroupSpec, "modelId">) => isSpecified(res.importId))
      .forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">, index: number) => {
        expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          expectedSpec.importId,
          "DB_ID_" + expectedSpec.importId
        )
      });
  })
});