// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {
  parseSkillsFromFile,
  parseSkillsFromUrl
} from "./skillsParser";
import {ISkillRepository} from "esco/skill/SkillRepository";
import {INewSkillSpec} from "esco/skill/skillModel";

jest.mock('https');

describe("test parseSkillsFromUrl", () => {
  test("should create skill from url file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an ISCOGroup repository
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/esco/skills/_test_data_/given.csv");
    // @ts-ignore
    mockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
      };
    });
    await parseSkillsFromUrl(givenModelId, "someUrl");

    // THEN expect the skill repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

describe("test parseSkillsFromFile", () => {
  test("should create skill from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND a skill repository
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
      batchCreate: jest.fn().mockResolvedValue([{}])
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseSkillsFromFile(givenModelId, "./src/import/esco/skills/_test_data_/given.csv");

    // THEN expect the skill repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

