// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  getCompletedProcessor,
  getHeadersValidator,
  getRowProcessor,
  IISCOGroupRow,
  parseISCOGroupsFromFile,
  parseISCOGroupsFromUrl
} from "./ISCOGroupsParser";
import {IISCOGroupRepository} from "esco/iscoGroup/ISCOGroupRepository";
import { INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroupModel";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {getStdHeadersValidator} from "import/stdHeadersValidator";
import {BatchProcessor} from "import/batch/BatchProcessor";

jest.mock('https');
jest.mock("import/stdHeadersValidator.ts", () => ({
  getStdHeadersValidator: jest.fn().mockReturnValue(() => true)
}));

describe("test headers validator", () => {
  test("should return true if all expected ISCOGroup headers are present ", () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // WHEN the getHeaderValidator is called with the given model id
    getHeadersValidator(givenModelId);

    // THEN expect the stdHeadersValidator to have been called with the expected given model and the
    // ISCO headers
    const expectedHeaders = [
      "ESCOURI",
      "ORIGINUUID",
      "CODE",
      "PREFERREDLABEL",
      "ALTLABELS",
      "DESCRIPTION"
    ];

    // @ts-ignore
    expect(getStdHeadersValidator).toBeCalledWith(givenModelId, expectedHeaders);
  })
})

describe("test getRowProcessor", () => {
  test("should add a new ISCOGroup specification based on the row to the batch", async () => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND a given row
    const givenRow: IISCOGroupRow = {
      ESCOURI: "ESCO:123",
      ORIGINUUID: "originUUID",
      CODE: "ISCO:123",
      PREFERREDLABEL: "preferredLabel",
      ALTLABELS: "altLabel1\naltLabel2",
      DESCRIPTION: "description"
    };
    // AND a batch processor
    const mockProcessBatchFn = jest.fn().mockResolvedValue(undefined);
    const batchProcessor = new BatchProcessor<INewISCOGroupSpec>(5000, mockProcessBatchFn);
    jest.spyOn(batchProcessor, "add");
    // AND a row processor for the given model id
    const rowProcessor = getRowProcessor(givenModelId, batchProcessor);

    // WHEN the row processor is called with the given row
    await rowProcessor(givenRow, 1);

    // THEN expect specification based on the row to be added to the batch
    const expectedSpec: INewISCOGroupSpec = {
      modelId: givenModelId,
      ESCOUri: "ESCO:123",
      originUUID: "originUUID",
      code: "ISCO:123",
      preferredLabel: "preferredLabel",
      altLabels: ["altLabel1", "altLabel2"],
      description: "description"
    }
    expect(batchProcessor.add).toBeCalledWith({...expectedSpec, modelId: givenModelId})
  })
})

describe("test completed processor", () => {
  test("should flush the batch processor", async () => {
    // GIVEN a batch processor with items in the batch queue
    const mockFlushFn = jest.fn().mockResolvedValue(undefined);
    const batchProcessor = new BatchProcessor<INewISCOGroupSpec>(5000, mockFlushFn);
    await batchProcessor.add({} as INewISCOGroupSpec);
    // AND a completed processor
    const completedProcessor = getCompletedProcessor(batchProcessor);

    // WHEN the completed processor is called
    await completedProcessor();

    // THEN expect the batch processor to have been flushed
    expect(mockFlushFn).toBeCalled();
  });
});

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
    const mockResponse = fs.createReadStream("./src/import/ISCOGroups/_test_data_/given.csv");
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
    await parseISCOGroupsFromFile(givenModelId, "./src/import/ISCOGroups/_test_data_/given.csv");

    // THEN expect the ISCOGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">) => {
      expect(mockRepository.batchCreate).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })
  })
});