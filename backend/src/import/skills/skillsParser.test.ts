// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";

import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {getRowProcessor, ISkillRow, parseSkillsFromFile, parseSkillsFromUrl} from "./skillsParser";
import {ISkillRepository} from "esco/skill/SkillRepository";
import {INewSkillSpec} from "esco/skill/skillModel";
import {getHeadersValidator} from "./skillsParser";
import {getStdHeadersValidator} from "import/stdHeadersValidator";

jest.mock('https');

jest.mock("import/stdHeadersValidator.ts", () => ({
  getStdHeadersValidator: jest.fn().mockReturnValue(() => true)
}));

describe("test getRowProcessor", () => {
  test("should create a skill", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";
    // AND a given row
    const givenRow: ISkillRow = {
      ESCOURI: "ESCO:123",
      ORIGINUUID: "originUUID",
      PREFERREDLABEL: "preferredLabel",
      ALTLABELS: "altLabel1\naltLabel2",
      DESCRIPTION: "description",
      DEFINITION: "definition",
      SCOPENOTE: "scopeNote",
      REUSELEVEL: "cross-sector",
      SKILLTYPE: "knowledge"
    };
    // AND a row processor for the given model id
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);
    const rowProcessor = getRowProcessor(givenModelId);

    // WHEN the row processor is called with the given row
    await rowProcessor(givenRow, 1);

    // THEN expect the skill repository to have been called with the correct spec
    // @ts-ignore
    const expectedSpec: INewSkillSpec = {
      modelId: givenModelId,
      ESCOUri: "ESCO:123",
      originUUID: "originUUID",
      preferredLabel: "preferredLabel",
      altLabels: ["altLabel1", "altLabel2"],
      description: "description",
      definition: "definition",
      scopeNote: "scopeNote",
      reuseLevel: "cross-sector",
      skillType: "knowledge"
    }
    expect(mockRepository.create).toBeCalledWith({...expectedSpec, modelId: givenModelId})
  })
  test("should return true if all expected Skill headers are present ", () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // WHEN the getHeaderValidator is called with the given model id
    getHeadersValidator(givenModelId);

    // THEN expect the stdHeadersValidator to have been called with the expected given model and the
    // skill headers
    const expectedHeaders = [
      "ESCOURI",
      "ORIGINUUID",
      "PREFERREDLABEL",
      "ALTLABELS",
      "DESCRIPTION",
      "DEFINITION",
      "SCOPENOTE",
      "REUSELEVEL",
      "SKILLTYPE"
    ];

    // @ts-ignore
    expect(getStdHeadersValidator).toBeCalledWith(givenModelId, expectedHeaders);
  })

  test("should not fail if creating the skill fails", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";
    // AND any given row
    const givenRow: ISkillRow  = {} as ISkillRow;
    // AND a repository that throws an error
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockRejectedValue(new Error("Some Error")),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);
    // AND a row processor for the given model id
    const rowProcessor = getRowProcessor(givenModelId);

    // WHEN the row processor is called with the given row
    const processPromise =  rowProcessor(givenRow, 1);

    // THEN expect the promise to not be rejected
    await expect(processPromise).resolves.not.toThrow();

    // AND expect the skill repository to have been called
    expect(mockRepository.create).toBeCalled()
  });
})

describe("test parseSkillsFromUrl", () => {
  test("should create skill from url file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an ISCOGroup repository
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/skills/_test_data_/given.csv");
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
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
    })
  })
});
describe("test parseSkillsFromFile", () => {
  test("should create skill from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND a skill repository
    const mockRepository: ISkillRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseSkillsFromFile(givenModelId, "./src/import/skills/_test_data_/given.csv");

    // THEN expect the skill repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
    })
  })
});

