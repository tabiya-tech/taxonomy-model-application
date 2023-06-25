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

jest.mock('https');

describe("test parseSkillGroups from", () => {

  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      // WHEN the csv file is downloaded and parsed
      // AND the response that returns the expected data
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
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      return parseSkillGroupsFromFile(givenModelId, "./src/import/esco/skillGroups/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create SkillGroups from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<number>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an SkillGroup repository
    const mockRepository: ISkillGroupRepository = {
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
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);


    // AND a map to map the ids of the CSV file to the database ids
    const importIdToDBIdMap = new Map<string, string>();
    jest.spyOn(importIdToDBIdMap, "set")

    // WHEN the data are parsed
    const actualCount = await parseCallBack(givenModelId, importIdToDBIdMap);

    // THEN expect the actual count to be the same as the expected count
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualCount).toBe(expectedResults.length);
    // AND expect the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">) => {
      expect(mockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })

    // AND expect the non-empty import ids to have been mapped to the db id
    expect(importIdToDBIdMap.set).toHaveBeenCalledTimes(2);


    expectedResults
      .filter((res: Omit<INewSkillGroupSpec, "modelId">) => isSpecified(res.importId))
      .forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">, index: number) => {
        expect(importIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          expectedSpec.importId,
          "DB_ID_" + expectedSpec.importId
        )
      });
  })
});