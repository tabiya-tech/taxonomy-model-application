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
import {INewSkillGroupSpec} from "esco/skillGroup/skillGroupModel";
jest.mock('https');

describe("test parseSkillGroupsFromUrl", () => {
  test("should create SkillGroup from url file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an SkillGroup repository
    const mockRepository: ISkillGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);

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
    await parseSkillGroupsFromUrl(givenModelId, "someUrl");

    // THEN expect the SkillGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

describe("test parseSkillGroupsFromFile", () => {
  test("should create SkillGroup from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an SkillGroup repository
    const mockRepository: ISkillGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseSkillGroupsFromFile(givenModelId, "./src/import/esco/skillGroups/_test_data_/given.csv");


    // THEN expect the ISCOGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});