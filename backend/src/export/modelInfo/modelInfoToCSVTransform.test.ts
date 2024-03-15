// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import ModelInfoToCSVTransform, * as SKillsToCSVTransformModule from "./modelInfoToCSVTransform";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { parse } from "csv-parse/sync";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfo } from "../../modelInfo/modelInfo.types";

const ModelInfoRepository = jest.spyOn(getRepositoryRegistry(), "modelInfo", "get");

const getMockModelInfo = (i: number): IModelInfo => {
  return {
    exportProcessState: [],
    importProcessState: {
      id: "",
      result: { errored: false, parsingErrors: false, parsingWarnings: false },
      status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: [
      {
        id: getMockStringId(1000 + i),
        UUID: `uuid_${i}`,
        name: `name_${i}_${getTestString(10)}`,
        version: `version_${i}_${getTestString(10)}`,
        localeShortCode: `shortCode_${i}_${getTestString(10)}`,
      },
    ],
    name: `name_${i}_${getTestString(10)}`,
    locale: {
      UUID: `localeUUID_${i}`,
      shortCode: `shortCode_${i}`,
      name: `name_${i}`,
    },
    description: `description_${i}_${getTestString(10)}`,
    version: `version_${i}`,
    released: true,
    releaseNotes: `releaseNotes_${i}_${getTestString(10)}`,
    createdAt: new Date(0), // use a fixed date to make the snapshot stable
    updatedAt: new Date(1), // use a fixed date to make the snapshot stable
  };
};

function setupModelInfoRepositoryMock(findByIdFn: () => IModelInfo | null) {
  const mockModelInfoRepository: IModelRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    getModelById: jest.fn().mockImplementationOnce(findByIdFn),
    getModels: jest.fn(),
    getModelByUUID: jest.fn(),
  };
  ModelInfoRepository.mockReturnValue(mockModelInfoRepository);
}

describe("ModelInfosDocToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["released", true],
    ["unreleased", false],
  ])(
    "should correctly transform ModelInfo data to CSV when model is %s",
    async (_description: string, givenReleased: boolean) => {
      // GIVEN findAll returns a stream of ModelInfos
      const givenModelInfo = getMockModelInfo(2);
      givenModelInfo.released = givenReleased;
      setupModelInfoRepositoryMock(() => givenModelInfo);

      // WHEN the transformation is applied
      const transformedStream = await ModelInfoToCSVTransform(givenModelInfo.id);

      // THEN the output should be a stream
      const chunks = [];
      for await (const chunk of transformedStream) {
        chunks.push(chunk);
      }
      const actualCSVOutput = chunks.join("");

      // AND be a valid CSV
      const parsedObjects = parse(actualCSVOutput, { columns: true });
      // AND contain the occupation data
      expect(parsedObjects).toMatchSnapshot();
      expect(actualCSVOutput).toMatchSnapshot();

      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    }
  );

  test.each([
    ["is empty", []],
    [
      "has one item",
      [
        {
          id: getMockStringId(1000),
          UUID: `uuid_1`,
          name: `name_1`,
          version: `version_1`,
          localeShortCode: `shortCode_1`,
        },
      ],
    ],
    [
      "has multiple items",
      [
        {
          id: getMockStringId(1000),
          UUID: `uuid_1`,
          name: `name_1`,
          version: `version_1`,
          localeShortCode: `shortCode_1`,
        },
        {
          id: getMockStringId(1001),
          UUID: `uuid_2`,
          name: `name_2`,
          version: `version_2`,
          localeShortCode: `shortCode_2`,
        },
      ],
    ],
  ])(
    `should correctly transform ModelInfo data to CSV when UUIDHistory %s`,
    async (
      _description: string,
      givenUUIDHistory: { id: string; UUID: string; name: string; version: string; localeShortCode: string }[]
    ) => {
      // GIVEN findAll returns a stream of ModelInfos
      const givenModelInfo = getMockModelInfo(2);
      givenModelInfo.UUIDHistory = givenUUIDHistory;
      setupModelInfoRepositoryMock(() => givenModelInfo);

      // WHEN the transformation is applied
      const transformedStream = await ModelInfoToCSVTransform(givenModelInfo.id);

      // THEN the output should be a stream
      const chunks = [];
      for await (const chunk of transformedStream) {
        chunks.push(chunk);
      }
      const actualCSVOutput = chunks.join("");

      // AND be a valid CSV
      const parsedObjects = parse(actualCSVOutput, { columns: true });
      // AND contain the occupation data
      expect(parsedObjects).toMatchSnapshot();
      expect(actualCSVOutput).toMatchSnapshot();

      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    }
  );

  describe("should handle errors during stream processing", () => {
    test("should throw an error if no model by that id exists in the db", () => {
      // GIVEN that findByIdAndStream will return a stream with the ModelInfo
      setupModelInfoRepositoryMock(() => null);

      // WHEN the transformation is applied
      const transformedStream = ModelInfoToCSVTransform(getMockStringId(1));

      // THEN expect the given error to be thrown
      return expect(transformedStream).rejects.toThrowError("ModelInfo not found");
    });
    test("should log an error and end the stream when the transformModelInfoSpecToCSVRow throws", async () => {
      // GIVEN that findByIdAndStream will return a stream with the ModelInfo
      const givenModelInfo = getMockModelInfo(3);
      setupModelInfoRepositoryMock(() => givenModelInfo);
      // AND the transformModelInfoToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(SKillsToCSVTransformModule, "transformModelInfoSpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = await ModelInfoToCSVTransform(givenModelInfo.id);

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform ModelInfo to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
      const expectedErrorMessage = `Failed to transform ModelInfo to CSV row: ${expectedLoggedItem}`;
      const expectedError = new Error(expectedErrorMessage, { cause: givenError });

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("Transforming ModelInfo to CSV failed", expectedError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
