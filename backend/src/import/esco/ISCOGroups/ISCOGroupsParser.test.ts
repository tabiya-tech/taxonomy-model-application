// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  parseISCOGroupsFromFile,
  parseISCOGroupsFromUrl
} from "./ISCOGroupsParser";
import {IISCOGroupRepository} from "esco/iscoGroup/ISCOGroupRepository";
import { INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroupModel";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";

jest.mock('https');

describe("test parseISCOGroupsFromUrl", () => {
  test("should create IISOGroup from url file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an ISCOGroup repository
    const mockRepository: IISCOGroupRepository = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/esco/ISCOGroups/_test_data_/given.csv");
    // @ts-ignore
    mockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
      };
    });
    await parseISCOGroupsFromUrl(givenModelId, "someUrl");

    // THEN expect the ISCOGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

describe("test parseISCOGroupsFromFile", () => {
  test("should create IISOGroup from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an ISCOGroup repository
    const mockRepository: IISCOGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseISCOGroupsFromFile(givenModelId, "./src/import/esco/ISCOGroups/_test_data_/given.csv");

    // THEN expect the ISCOGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});