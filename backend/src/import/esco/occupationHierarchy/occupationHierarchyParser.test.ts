// mute console.log
//import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {OccupationHierarchyRepository} from "esco/occupationHierarchy/occupationHierarchyRepository";
import {parseOccupationHierarchyFromFile, parseOccupationHierarchyFromUrl} from "./occupationHierarchyParser";
import {INewOccupationHierarchyPairSpec} from "esco/occupationHierarchy/occupationHierarchy.types";

jest.mock('https');

describe("test parseOccupationHierarchyFromUrl", () => {
  test("should create Occupation Hierarchy from url file", async () => {
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
    const idMap = new Map<string,string>();
    jest.spyOn(idMap, "get").mockImplementation((key)=>{
      return "mapped_" + key;
    })

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
    const actualCount = await parseOccupationHierarchyFromUrl(givenModelId, "someUrl", idMap);

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
  })
});

describe("test parseOccupationHierarchyFromFile", () => {
  test("should create Occupation Hierarchy from csv file", async () => {
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
    const importIdToDBIdMap = new Map<string,string>();
    jest.spyOn(importIdToDBIdMap, "get").mockImplementation((key)=>{
      return "mapped_" + key;
    })

    // WHEN the csv file is parsed
    const actualCount = await parseOccupationHierarchyFromFile(givenModelId, "./src/import/esco/occupationHierarchy/_test_data_/given.csv", importIdToDBIdMap);

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
  })
});