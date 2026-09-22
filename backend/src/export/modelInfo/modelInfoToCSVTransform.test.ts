// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import ModelInfoToCSVTransform, * as SKillsToCSVTransformModule from "./modelInfoToCSVTransform";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import LanguageAPISpecs from "api-specifications/language";
import { parse } from "csv-parse/sync";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfo } from "modelInfo/modelInfo.types";

const ModelInfoRepository = jest.spyOn(getRepositoryRegistry(), "modelInfo", "get");

const getMockModelInfo = (i: number): IModelInfo => {
  return {
    exportProcessState: [],
    embeddingProcessState: [],
    importProcessState: {
      id: "",
      result: { errored: false, parsingErrors: false, parsingWarnings: false },
      status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: [`uuid_1`, `uuid_2`],
    name: `name_${i}_${getTestString(10)}`,
    locale: {
      UUID: `localeUUID_${i}`,
      shortCode: `shortCode_${i}`,
      name: `name_${i}`,
    },
    availableLanguages: [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode],
    description: `description_${i}_${getTestString(10)}`,
    license: `description_${i}_${getTestString(10)}`,
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
    getHistory: jest.fn(),
    getModelsByIds: jest.fn(),
    releaseModel: jest.fn(),
    updateAvailableLanguages: jest.fn(),
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
    ["has one item", [`uuid_1`]],
    ["has multiple items", [`uuid_1`, `uuid_2`]],
  ])(
    `should correctly transform ModelInfo data to CSV when UUIDHistory %s`,
    async (_description: string, givenUUIDHistory: string[]) => {
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

  test.each([
    ["a model with a single fallback language", [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode], "en"],
    ["a model with multiple languages", ["en", "fr", "es"], "en\nfr\nes"],
    ["a legacy (pre-migration) model where availableLanguages is not set in the database", undefined, ""],
  ])(
    "should encode LANGUAGES as a newline-separated list for %s",
    async (_description: string, givenAvailableLanguages: string[] | undefined, expectedLanguages: string) => {
      // GIVEN a ModelInfo with the given availableLanguages
      const givenModelInfo = getMockModelInfo(2);
      // @ts-ignore
      givenModelInfo.availableLanguages = givenAvailableLanguages;
      setupModelInfoRepositoryMock(() => givenModelInfo);

      // WHEN the transformation is applied
      const transformedStream = await ModelInfoToCSVTransform(givenModelInfo.id);

      // THEN the output should be a stream
      const chunks = [];
      for await (const chunk of transformedStream) {
        chunks.push(chunk);
      }
      const actualCSVOutput = chunks.join("");

      // AND the LANGUAGES column should be the newline-separated list of availableLanguages, positioned between
      // LOCALE and DESCRIPTION
      const parsedObjects = parse(actualCSVOutput, { columns: true });
      expect(parsedObjects[0].LANGUAGES).toEqual(expectedLanguages);
      expect(Object.keys(parsedObjects[0])).toEqual(expect.arrayContaining(["LOCALE", "LANGUAGES", "DESCRIPTION"]));
      const headerLine = actualCSVOutput.split("\n")[0];
      const localeIndex = headerLine.indexOf('"LOCALE"');
      const languagesIndex = headerLine.indexOf('"LANGUAGES"');
      const descriptionIndex = headerLine.indexOf('"DESCRIPTION"');
      expect(localeIndex).toBeLessThan(languagesIndex);
      expect(languagesIndex).toBeLessThan(descriptionIndex);

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

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
