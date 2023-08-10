// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  parseISCOGroupsFromFile,
  parseISCOGroupsFromUrl
} from "./ISCOGroupsParser";
import {IISCOGroupRepository} from "esco/iscoGroup/ISCOGroupRepository";
import {IISCOGroup, INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {isSpecified} from "server/isUnspecified";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

jest.mock('https');

describe("test parseISCOGroups from", () => {
  test.each([
      ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
        const mockResponse = fs.createReadStream("./src/import/esco/ISCOGroups/_test_data_/given.csv");
        // @ts-ignore
        mockResponse.statusCode = StatusCodes.OK; // Set the status code
        (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
          callback(mockResponse);
          return {
            on: jest.fn(),
          };
        });
        return parseISCOGroupsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
      }],
      ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
        return parseISCOGroupsFromFile(givenModelId, "./src/import/esco/ISCOGroups/_test_data_/given.csv", importIdToDBIdMap);
      }]
    ]
  )("should create IISOGroups from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<RowsProcessedStats>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND an ISCOGroup repository
    const givenMockRepository: IISCOGroupRepository = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockImplementation((specs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> => {
        return Promise.resolve(specs.map((spec: INewISCOGroupSpec): IISCOGroup => {
          return {
            ...spec,
            id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
            UUID: "",
            parent: null,
            children: [],
            updatedAt: new Date(),
            createdAt: new Date()
          };
        }));
      }),
      findById: jest.fn().mockResolvedValue({})
    };
    jest.spyOn(getRepositoryRegistry(), "ISCOGroup", "get").mockReturnValue(givenMockRepository);
    // AND a map to map the ids of the CSV file to the database ids
    const givenImportIdToDBIdMap = new Map<string, string>();
    jest.spyOn(givenImportIdToDBIdMap, "set")

    // WHEN the data are parsed
    const actualStats: RowsProcessedStats = await parseCallBack(givenModelId, givenImportIdToDBIdMap);

    // THEN expect all the rows to have been processed successfully
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualStats).toEqual({
      rowsProcessed: expectedResults.length,
      rowsSuccess: expectedResults.length,
      rowsFailed: 0
    });
    // AND the entries to have been created in the database
    expectedResults.forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">) => {
      expect(givenMockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    });
    // AND the non-empty import ids to have been mapped to the db id
    expect(givenImportIdToDBIdMap.set).toHaveBeenCalledTimes(2);
    expectedResults
      .filter((res: Omit<INewISCOGroupSpec, "modelId">) => isSpecified(res.importId))
      .forEach((expectedSpec: Omit<INewISCOGroupSpec, "modelId">, index: number) => {
        expect(givenImportIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          expectedSpec.importId,
          "DB_ID_" + expectedSpec.importId
        )
      });
  });
});