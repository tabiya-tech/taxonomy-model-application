// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {OccupationHierarchyRepository} from "esco/occupationHierarchy/occupationHierarchyRepository";
import {parseOccupationHierarchyFromFile, parseOccupationHierarchyFromUrl} from "./occupationHierarchyParser";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair
} from "esco/occupationHierarchy/occupationHierarchy.types";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";
import {MongooseModelName} from "esco/common/mongooseModelNames";

jest.mock('https');

describe("test parseOccupationHierarchy from", () => {

  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      const mockResponse = fs.createReadStream("./src/import/esco/occupationHierarchy/_test_data_/given.csv");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      return parseOccupationHierarchyFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
    }],
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> => {
      return parseOccupationHierarchyFromFile(givenModelId, "./src/import/esco/occupationHierarchy/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create Occupation Hierarchy from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<RowsProcessedStats>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";
    // AND an OccupationHierarchy repository
    const givenMockRepository: OccupationHierarchyRepository = {
      iscoGroupModel: undefined as any,
      occupationModel: undefined as any,
      hierarchyModel: undefined as any,
      createMany: jest.fn().mockImplementation((modelId: string, specs: INewOccupationHierarchyPairSpec[]): Promise<IOccupationHierarchyPair[]> => {
        return Promise.resolve(specs.map((spec: INewOccupationHierarchyPairSpec): IOccupationHierarchyPair => {
          return {
            ...spec,
            id: "DB_ID_", // + spec.importId,
            modelId: modelId,
            childDocModel: MongooseModelName.ISCOGroup,
            parentDocModel: MongooseModelName.Occupation,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }))
      }),
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupationHierarchy", "get").mockReturnValue(givenMockRepository);
    // AND the ids of the CSV file are mapped to database ids
    const importIdToDBIdMap = new Map<string, string>();
    jest.spyOn(importIdToDBIdMap, "get").mockImplementation((key) => {
      return "mapped_" + key;
    })

    // WHEN the data are parsed
    const actualStats = await parseCallBack(givenModelId, importIdToDBIdMap);

    // THEN expect all the hierarchy entries to have been processed successfully
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualStats).toEqual({
      rowsProcessed: expectedResults.length,
      rowsSuccess: expectedResults.length,
      rowsFailed: 0
    });
    // AND the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewOccupationHierarchyPairSpec, "modelId">) => {
      expect(givenMockRepository.createMany).toHaveBeenLastCalledWith(
        givenModelId,
        expect.arrayContaining([{...expectedSpec}])
      )
    })
  });
});