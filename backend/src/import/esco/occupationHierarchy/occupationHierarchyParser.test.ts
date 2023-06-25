// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {OccupationHierarchyRepository} from "esco/occupationHierarchy/occupationHierarchyRepository";
import {parseOccupationHierarchyFromFile, parseOccupationHierarchyFromUrl} from "./occupationHierarchyParser";
import {INewOccupationHierarchyPairSpec} from "esco/occupationHierarchy/occupationHierarchy.types";

jest.mock('https');

describe("test parseOccupationHierarchy from", () => {

  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      // WHEN the csv file is downloaded and parsed
      // AND the response that returns the expected data
      const mockResponse = fs.createReadStream("./src/import/esco/occupationHierarchy/_test_data_/given.csv");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      return parseOccupationHierarchyFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
    }],
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      return parseOccupationHierarchyFromFile(givenModelId, "./src/import/esco/occupationHierarchy/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create Occupation Hierarchy from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<number>) => {
// GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND an OccupationHierarchy repository
    const mockRepository: OccupationHierarchyRepository = {
      iscoGroupModel: undefined as any,
      occupationModel: undefined as any,
      hierarchyModel: undefined as any,
      createMany: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupationHierarchy", "get").mockReturnValue(mockRepository);
    // AND the ids of the CSV file are mapped to database ids
    const importIdToDBIdMap = new Map<string, string>();
    jest.spyOn(importIdToDBIdMap, "get").mockImplementation((key) => {
      return "mapped_" + key;
    })

    // WHEN the data are parsed
    const actualCount = await parseCallBack(givenModelId, importIdToDBIdMap);

    // THEN expect the actual count to be the same as the expected count
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualCount).toBe(expectedResults.length);
    // AND expect the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewOccupationHierarchyPairSpec, "modelId">) => {
      expect(mockRepository.createMany).toHaveBeenLastCalledWith(
        givenModelId,
        expect.arrayContaining([{...expectedSpec}])
      )
    })
  });
});