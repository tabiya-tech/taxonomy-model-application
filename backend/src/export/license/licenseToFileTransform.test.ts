import { IModelInfo } from "modelInfo/modelInfo.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { getTestString } from "_test_utilities/specialCharacters";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

import LicenseToFileTransform from "./licenseToFileTransform";

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
    UUIDHistory: [`uuid_1`, `uuid_2`],
    name: `name_${i}_${getTestString(10)}`,
    locale: {
      UUID: `localeUUID_${i}`,
      shortCode: `shortCode_${i}`,
      name: `name_${i}`,
    },
    description: `description_${i}_${getTestString(10)}`,
    license: `license_${i}_${getTestString(10)}`,
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
  };
  ModelInfoRepository.mockReturnValue(mockModelInfoRepository);
}

describe("LicenseToFileTransform.test.ts", () => {
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
      const transformedStream = await LicenseToFileTransform(givenModelInfo.id);

      // THEN the output should be a stream
      const chunks = [];
      for await (const chunk of transformedStream) {
        chunks.push(chunk);
      }
      const actualLicenseContent = chunks.join("");

      // AND license should be the same
      expect(actualLicenseContent).toBe(givenModelInfo.license);

      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    }
  );

  test("it should throw an error if the modelInfo is not found", async () => {
    // GIVEN findAll returns a stream of ModelInfos
    setupModelInfoRepositoryMock(() => null);

    // WHEN the transformation is applied
    await expect(LicenseToFileTransform("")).rejects.toThrow("ModelInfo not found");
  });

  test("should return empty stream if license is empty", async () => {
    // GIVEN findAll returns a stream of ModelInfos
    const givenModelInfo = getMockModelInfo(2);
    givenModelInfo.license = "";
    setupModelInfoRepositoryMock(() => givenModelInfo);

    // WHEN the transformation is applied
    const transformedStream = await LicenseToFileTransform(givenModelInfo.id);

    // THEN the output should be a stream
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }

    const actualLicenseContent = chunks.join("");

    // AND license should be the same
    expect(actualLicenseContent).toBe(givenModelInfo.license);

    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  test("should return empty stream if license is undefined", async () => {
    // GIVEN findAll returns a stream of ModelInfos
    const givenModelInfo = getMockModelInfo(2);
    givenModelInfo.license = undefined as never;
    setupModelInfoRepositoryMock(() => givenModelInfo);

    // WHEN the transformation is applied
    const transformedStream = await LicenseToFileTransform(givenModelInfo.id);

    // THEN the output should be a stream
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }

    const actualLicenseContent = chunks.join("");

    // AND license should be empty string
    expect(actualLicenseContent).toBe("");

    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });
});
