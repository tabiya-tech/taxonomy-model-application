// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import LocalizedOccupationsToCSVTransform, * as LocalizedOccupationsToCSVTransformModule from "./LocalizedOccupationsToCSVTransform";
import { parse } from "csv-parse/sync";
import { IUnpopulatedLocalizedOccupation } from "./LocalizedOccupationsToCSVTransform";
import { OccupationType } from "esco/common/objectTypes";
import { ILocalizedOccupationRepository } from "esco/localizedOccupation/localizedOccupationRepository";

const LocalizedOccupationRepository = jest.spyOn(getRepositoryRegistry(), "localizedOccupation", "get");

const getMockLocalizedOccupations = (): IUnpopulatedLocalizedOccupation[] => {
  return Array.from<never, IUnpopulatedLocalizedOccupation>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuid_${i}_${getTestString(80)}`, `uuid_${i + 1}_${getTestString(80)}`] : [],
    altLabels: i % 2 ? [`altLabel_1_${getTestString(80)}`, `altLabel_2_${getTestString(80)}`] : [],
    modelId: getMockStringId(1),
    description: `description_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    occupationType: OccupationType.LOCALIZED,
    localizesOccupationId: getMockStringId(2),
    localizedOccupationType: OccupationType.LOCALIZED,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupLocalizedOccupationRepositoryMock(findAllImpl: () => Readable) {
  const mockLocalizedOccupationRepository: ILocalizedOccupationRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  LocalizedOccupationRepository.mockReturnValue(mockLocalizedOccupationRepository);
}

describe("LocalizedOccupationToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should correctly transform LocalizedOccupation data to CSV", async () => {
    // GIVEN findAll returns a stream of LocalizedOccupations
    const givenLocalizedOccupations = getMockLocalizedOccupations();
    setupLocalizedOccupationRepositoryMock(() => Readable.from(givenLocalizedOccupations));

    // WHEN the transformation is applied
    const transformedStream = LocalizedOccupationsToCSVTransform("foo");

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
  });

  describe("should handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source LocalizedOccupation stream will emit an error
      const givenError = new Error("Test Error");
      setupLocalizedOccupationRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = LocalizedOccupationsToCSVTransform("foo");
      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrow(givenError);
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the transformLocalizedOccupationSpecToCSVRow throws", async () => {
      // GIVEN findAll will return a stream of LocalizedOccupations
      setupLocalizedOccupationRepositoryMock(() => Readable.from(getMockLocalizedOccupations()));
      // AND  the transformLocalizedOccupationSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest
        .spyOn(LocalizedOccupationsToCSVTransformModule, "transformLocalizedOccupationSpecToCSVRow")
        .mockImplementationOnce((_: IUnpopulatedLocalizedOccupation) => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = LocalizedOccupationsToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform LocalizedOccupation to CSV row");
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
