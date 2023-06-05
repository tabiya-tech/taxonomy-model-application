import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {getRowProcessor, parseSkillGroupsFromFile, parseSkillGroupsFromUrl} from "./skillGroupsParser";

import fs from "fs";
import https from "https";
import {StatusCodes} from "../../server/httpUtils";
import {ISkillGroupRow} from "./skillGroupsParser";
import {ISkillGroupRepository} from "../../skillGroup/SkillGroupRepository";
import {INewSkillGroupSpec} from "../../skillGroup/skillGroupModel";

jest.mock('https');

describe("test getRowProcessor", () => {
  test("should create an SkillGroup", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";
    // AND a given row
    const givenRow: ISkillGroupRow = {
      ESCOURI: "ESCO:123",
      ORIGINUUID: "originUUID",
      CODE: "ISCO:123",
      PREFERREDLABEL: "preferredLabel",
      ALTLABELS: "altLabel1\naltLabel2",
      DESCRIPTION: "description",
      SCOPENOTE: "scopeNote"
    };
    // AND a row processor for the given model id
    const mockRepository: ISkillGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);
    const rowProcessor = getRowProcessor(givenModelId);

    // WHEN the row processor is called with the given row
    await rowProcessor(givenRow, 1);

    // THEN expect the SkillGroup repository to have been called with the correct spec
    const expectedSpec: INewSkillGroupSpec = {
      modelId: givenModelId,
      ESCOUri: "ESCO:123",
      originUUID: "originUUID",
      code: "ISCO:123",
      preferredLabel: "preferredLabel",
      altLabels: ["altLabel1", "altLabel2"],
      description: "description",
      scopeNote: "scopeNote"
    }
    expect(mockRepository.create).toBeCalledWith({...expectedSpec, modelId: givenModelId})
  })
})

describe("test parseSkillGroupsFromUrl", () => {
  test("should create SkillGroup from url file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an SkillGroup repository
    const mockRepository: ISkillGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/skillGroups/_test_data_/given.csv");
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
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
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
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skillGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseSkillGroupsFromFile(givenModelId, "./src/import/skillGroups/_test_data_/given.csv");

    // THEN expect the SkillGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillGroupSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
    })
  })
});

