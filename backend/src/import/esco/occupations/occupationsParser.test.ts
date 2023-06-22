// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  parseOccupationsFromFile,
  parseOccupationsFromUrl
} from "./occupationsParser";
import {IOccupationRepository} from "esco/occupation/OccupationRepository";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {INewOccupationSpec} from "esco/occupation/occupation.types";

jest.mock('https');

describe("test parseOccupationsFromUrl", () => {
  test("should create IISOGroup from url file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an Occupation repository
    const mockRepository: IOccupationRepository = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue([{}]),
      findById:jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/esco/occupations/_test_data_/given.csv");
    // @ts-ignore
    mockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
      };
    });
    const actualCount =  await parseOccupationsFromUrl(givenModelId, "someUrl");

    // THEN expect the actual count to be the same as the expected count
    const expectedResults =  require("./_test_data_/expected.ts").expected;
    expect(actualCount).toBe(expectedResults.length);
    // AND expect the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">) => {
      expect(mockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

describe("test parseOccupationsFromFile", () => {
  test("should create IISOGroup from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an Occupation repository
    const mockRepository: IOccupationRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    const actualCount = await parseOccupationsFromFile(givenModelId, "./src/import/esco/occupations/_test_data_/given.csv");

    // THEN expect the actual count to be the same as the expected count
    const expectedResults =  require("./_test_data_/expected.ts").expected;
    expect(actualCount).toBe(expectedResults.length);
    // AND expect the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">) => {
      expect(mockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});