// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import * as BaseOccupationsToCSVTransformModule from "./BaseOccupationsToCSVTransform";
import BaseOccupationsToCSVTransform, { IUnpopulatedOccupation } from "./BaseOccupationsToCSVTransform";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationRepository } from "esco/occupation/occupationRepository";
import { parse } from "csv-parse/sync";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import { OccupationType } from "esco/common/objectTypes";

const OccupationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupation", "get");

const getMockOccupations = (occupationType: OccupationType.LOCAL | OccupationType.ESCO): IUnpopulatedOccupation[] => {
  return Array.from<never, IUnpopulatedOccupation>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuid_${i}_${getTestString(80)}`] : [],
    ISCOGroupCode: `ISCOGroupCode_${i}`,
    definition: `definition_${i}_${getTestString(80)}`,
    regulatedProfessionNote: `regulatedProfessionNote_${i}_${getTestString(80)}`,
    scopeNote: `scopeNote_${i}_${getTestString(80)}`,
    altLabels: i % 2 ? [`altLabel_1_${getTestString(80)}`, `altLabel_2_${getTestString(80)}`] : [],
    code: `code_${i}`,
    preferredLabel: `Occupation_${i}_${getTestString(80)}`,
    modelId: getMockStringId(1),
    originUri: `originUri_${i}_${getTestString(80)}`,
    description: `description_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    occupationType: occupationType,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationRepository: IOccupationRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationRepositorySpy.mockReturnValue(mockOccupationRepository);
}

describe("BaseOccupationsDoc2csvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe.each([[OccupationType.ESCO], [OccupationType.LOCAL]])("Test %s occupation type", (givenOccupationType) => {
    test(`should correctly transform occupation data to CSV`, async () => {
      // GIVEN findAll returns a stream of occupations
      const givenOccupations = getMockOccupations(givenOccupationType as OccupationType.LOCAL | OccupationType.ESCO);
      setupOccupationRepositoryMock(() => Readable.from(givenOccupations));

      // WHEN the transformation is applied
      const transformedStream = BaseOccupationsToCSVTransform(
        "foo",
        givenOccupationType as OccupationType.LOCAL | OccupationType.ESCO
      );

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
        // GIVEN that the source occupation stream will emit an error
        const givenError = new Error("Test Error");
        setupOccupationRepositoryMock(
          () =>
            new Readable({
              read() {
                this.emit("error", givenError);
              },
            })
        );

        // WHEN the transformation stream is consumed
        const transformedStream = BaseOccupationsToCSVTransform(
          "foo",
          givenOccupationType as OccupationType.LOCAL | OccupationType.ESCO
        );
        // THEN expect the given error to be thrown
        await expect(async () => {
          //  iterate to consume the stream
          for await (const _ of transformedStream) {
            // do nothing
          }
        }).rejects.toThrow(givenError);

        // THEN the error should be logged
        const expectedErrorMessage = `Transforming ${givenOccupationType} occupations to CSV failed`;
        expect(console.error).toHaveBeenCalledWith(
          expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
        );

        // AND the stream should end
        expect(transformedStream.closed).toBe(true);
      });

      test("should log an error and end the stream when the transformOccupationSpecToCSVRow throws", async () => {
        // GIVEN findAll returns a stream of occupations
        setupOccupationRepositoryMock(() =>
          Readable.from(getMockOccupations(givenOccupationType as OccupationType.LOCAL | OccupationType.ESCO))
        );

        // AND  the transformOccupationSpecToCSVRow will throw an error
        const givenError = new Error("Mocked Transformation Error");
        const transformFunctionSpy = jest
          .spyOn(BaseOccupationsToCSVTransformModule, "transformOccupationSpecToCSVRow")
          .mockImplementationOnce(() => {
            throw givenError;
          });

        // WHEN the transformation stream is consumed
        const transformedStream = BaseOccupationsToCSVTransform(
          "foo",
          givenOccupationType as OccupationType.LOCAL | OccupationType.ESCO
        );
        // THEN expect the given error to be thrown

        await expect(async () => {
          //  iterate to consume the stream
          for await (const _ of transformedStream) {
            // do nothing
          }
        }).rejects.toThrowError(`Failed to transform ${givenOccupationType} occupation to CSV row`);

        // THEN the error should be logged
        const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
        const expectedErrorMessage = `Failed to transform ${givenOccupationType} occupation to CSV row: ${expectedLoggedItem}`;
        const expectedError = new Error(expectedErrorMessage, { cause: givenError });

        expect(console.error).toHaveBeenCalledWith(
          expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.toMatchErrorWithCause(
            `Transforming ${givenOccupationType} occupations to CSV failed`,
            expectedError.message
          )
        );

        // AND the stream should end
        expect(transformedStream.closed).toBe(true);
      });
    });
  });
});
