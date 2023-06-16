// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";

import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {
  getRowProcessor,
  getCompletedProcessor,
  ISkillRow,
  parseSkillsFromFile,
  parseSkillsFromUrl
} from "./skillsParser";
import {ISkillRepository} from "esco/skill/SkillRepository";
import {INewSkillSpec} from "esco/skill/skillModel";
import {getHeadersValidator} from "./skillsParser";
import {getStdHeadersValidator} from "import/stdHeadersValidator";
import {BatchProcessor} from "../batch/BatchProcessor";

jest.mock('https');

jest.mock("import/stdHeadersValidator.ts", () => ({
  getStdHeadersValidator: jest.fn().mockReturnValue(() => true)
}));

describe("test headers validator", () => {
  test("should return true if all expected Skill headers are present ", () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

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
})

describe("test getRowProcessor", () => {
  test("should create a skill", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
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
    // AND a batch processor
    const mockProcessBatchFn = jest.fn().mockResolvedValue(undefined);
    const batchProcessor = new BatchProcessor<INewSkillSpec>(5000, mockProcessBatchFn);
    jest.spyOn(batchProcessor, "add");
    // AND a row processor for the given model id
    const rowProcessor = getRowProcessor(givenModelId, batchProcessor);

    // WHEN the row processor is called with the given row
    await rowProcessor(givenRow, 1);

    // THEN expect specification based on the row to be added to the batch
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
    expect(batchProcessor.add).toBeCalledWith({...expectedSpec, modelId: givenModelId})
  })

})

describe("test completed processor", () => {
  test("should flush the batch processor", async () => {
    // GIVEN a batch processor with items in the batch queue
    const mockFlushFn = jest.fn().mockResolvedValue(undefined);
    const batchProcessor = new BatchProcessor<INewSkillSpec>(5000, mockFlushFn);
    await batchProcessor.add({} as INewSkillSpec);
    // AND a completed processor
    const completedProcessor = getCompletedProcessor(batchProcessor);

    // WHEN the completed processor is called
    await completedProcessor();

    // THEN expect the batch processor to have been flushed
    expect(mockFlushFn).toBeCalled();
  });
});

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
    await parseSkillsFromFile(givenModelId, "./src/import/skills/_test_data_/given.csv");

    // THEN expect the skill repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewSkillSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});

