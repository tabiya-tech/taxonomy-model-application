import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {getRowProcessor, IISCOGroupRow, parseISCOGroupsFromFile, parseISCOGroupsFromUrl} from "./ISCOGroupsParser";
import {IISCOGroupRepository} from "../../iscoGroup/ISCOGroupRepository";
import {INewISCOGroupSpec} from "../../iscoGroup/ISCOGroupModel";
import fs from "fs";
import https from "https";
import {StatusCodes} from "../../server/httpUtils";

jest.mock('https');

describe("test getRowProcessor", () => {
  test("should create an ISCOGroup", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";
    // AND a given row
    const givenRow: IISCOGroupRow = {
      ESCOURI: "ESCO:123",
      ORIGINUUID: "originUUID",
      ISCOCODE: "ISCO:123",
      PREFERREDLABEL: "preferredLabel",
      ALTLABELS: "altLabel1\naltLabel2",
      DESCRIPTION: "description"
    };
    // AND a row processor for the given model id
    const mockRepository: IISCOGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(mockRepository);
    const rowProcessor = getRowProcessor(givenModelId);

    // WHEN the row processor is called with the given row
    await rowProcessor(givenRow, 1);

    // THEN expect the ISCOGroup repository to have been called with the correct spec
    const expectedSpec: INewISCOGroupSpec = {
      modelId: givenModelId,
      ESCOUri: "ESCO:123",
      originUUID: "originUUID",
      ISCOCode: "ISCO:123",
      preferredLabel: "preferredLabel",
      altLabels: ["altLabel1", "altLabel2"],
      description: "description"
    }
    expect(mockRepository.create).toBeCalledWith({...expectedSpec, modelId: givenModelId})
  })

  test("should not fail if creating the ISCOGroup fails", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";
    // AND any a given row
    const givenRow: IISCOGroupRow = {} as IISCOGroupRow;
    // AND a row processor for the given model id
    const mockRepository: IISCOGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockRejectedValue(new Error("Some Error")),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(mockRepository);
    const rowProcessor = getRowProcessor(givenModelId);

    // WHEN the row processor is called with the given row
    const processPromise =  rowProcessor(givenRow, 1);

    // THEN expect the promise to not be rejected
    await expect(processPromise).resolves.not.toThrow();

    // AND expect the ISCOGroup repository to have been called
    expect(mockRepository.create).toBeCalled()
  });
})

describe("test parseISCOGroupsFromUrl", () => {
  test("should create IISOGroup from url file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an ISCOGroup repository
    const mockRepository: IISCOGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
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
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
    })
  })
});
describe("test parseISCOGroupsFromFile", () => {
  test("should create IISOGroup from csv file", async () => {
    // GIVEN a model id
    const givenModelId = "modelId";

    // AND an ISCOGroup repository
    const mockRepository: IISCOGroupRepository = {
      // @ts-ignore
      Model: undefined,
      create: jest.fn().mockResolvedValue({}),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is parsed
    await parseISCOGroupsFromFile(givenModelId, "./src/import/ISCOGroups/_test_data_/given.csv");

    // THEN expect the ISCOGroup repository to have been called with the correct spec
    require("./_test_data_/expected.ts").expected.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">, index: number) => {
      expect(mockRepository.create).toHaveBeenNthCalledWith(index + 1, {...expectedSpec, modelId: givenModelId});
    })
  })
});

