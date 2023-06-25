// mute console.log
import "_test_utilities/consoleMock";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  parseOccupationsFromFile,
  parseOccupationsFromUrl
} from "./occupationsParser";
import {IOccupationRepository} from "esco/occupation/OccupationRepository";
import fs from "fs";
import https from "https";
import {StatusCodes} from "server/httpUtils";
import {INewOccupationSpec, IOccupation} from "esco/occupation/occupation.types";
import {isSpecified} from "server/isUnspecified";

jest.mock('https');

describe("test parseOccupations from", () => {
  test.each([
    ["url file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      // WHEN the csv file is downloaded and parsed
      // AND the response that returns the expected data
      const mockResponse = fs.createReadStream("./src/import/esco/occupations/_test_data_/given.csv");
      // @ts-ignore
      mockResponse.statusCode = StatusCodes.OK; // Set the status code
      (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn(),
        };
      });
      return parseOccupationsFromUrl(givenModelId, "someUrl", importIdToDBIdMap);
    }],
    ["csv file", (givenModelId: string, importIdToDBIdMap: Map<string, string>): Promise<number> => {
      return parseOccupationsFromFile(givenModelId, "./src/import/esco/occupations/_test_data_/given.csv", importIdToDBIdMap);
    }]
  ])
  ("should create Occupations from %s", async (description, parseCallBack: (givenModelId: string, importIdToDBIdMap: Map<string, string>) => Promise<number>) => {
    // GIVEN a model id
    const givenModelId = "foo-model-id";

    // AND an Occupation repository
    const mockRepository: IOccupationRepository = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockImplementation((specs: INewOccupationSpec[]): Promise<IOccupation[]> => {
        return Promise.resolve(specs.map((spec: INewOccupationSpec): IOccupation => {
          return {
            ...spec,
            id: "DB_ID_" + spec.importId, // add the importId as the id so that we can find it later and check that it was mapped correctly
            UUID: "",
            parent: null,
            children: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }));
      }),
      findById: jest.fn().mockResolvedValue(null)
    };
    // @ts-ignore
    jest.spyOn(getRepositoryRegistry(), "occupation", "get").mockReturnValue(mockRepository);

    // WHEN the csv file is downloaded and parsed
    // AND the response that returns the expected data
    const mockResponse = fs.createReadStream("./src/import/esco/occupations/_test_data_/given.csv");
    // @ts-ignore
    mockResponse.statusCode = StatusCodes.OK; // Set the status code
    (https.get as jest.Mock).mockImplementationOnce((url, callback) => {
      callback(mockResponse);
      return {
        on: jest.fn(),
      };
    });
    // AND a map to map the ids of the CSV file to the database ids
    const importIdToDBIdMap = new Map<string, string>();
    jest.spyOn(importIdToDBIdMap, "set")

    // WHEN the data are parsed
    const actualCount = await parseCallBack(givenModelId, importIdToDBIdMap);

    // THEN expect the actual count to be the same as the expected count
    const expectedResults = require("./_test_data_/expected.ts").expected;
    expect(actualCount).toBe(expectedResults.length);
    // AND expect the repository to have been called with the correct spec
    expectedResults.forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">) => {
      expect(mockRepository.createMany).toHaveBeenLastCalledWith(
        expect.arrayContaining([{...expectedSpec, modelId: givenModelId}])
      )
    })

    // AND expect the non-empty import ids to have been mapped to the db id
    expect(importIdToDBIdMap.set).toHaveBeenCalledTimes(2);

    expectedResults
      .filter((res: Omit<INewOccupationSpec, "modelId">) => isSpecified(res.importId))
      .forEach((expectedSpec: Omit<INewOccupationSpec, "modelId">, index: number) => {
        expect(importIdToDBIdMap.set).toHaveBeenNthCalledWith(
          index + 1,
          expectedSpec.importId,
          "DB_ID_" + expectedSpec.importId
        )
      });
  });

});