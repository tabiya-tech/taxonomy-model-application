// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationGroupRepository } from "esco/occupationGroup/OccupationGroupRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import OccupationGroupsToCSVTransform, * as OccupationGroupsToCSVTransformModule from "./OccupationGroupsToCSVTransform";
import { IUnpopulatedOccupationGroup } from "./OccupationGroupsToCSVTransform";
import { parse } from "csv-parse/sync";
import { OccupationGroupType } from "esco/occupationGroup/OccupationGroup.types";

const OccupationGroupRepository = jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get");

const getMockOccupationGroups = (): IUnpopulatedOccupationGroup[] => {
  return Array.from<never, IUnpopulatedOccupationGroup>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuid_${i}_${getTestString(80)}`, `uuid_${i + 1}_${getTestString(80)}`] : [],
    code: `code_${i}`,
    preferredLabel: `OccupationGroup_${i}_${getTestString(80)}`,
    altLabels: i % 2 ? [`altLabel_1_${getTestString(80)}`, `altLabel_2_${getTestString(80)}`] : [],
    description: `description_${i}_${getTestString(80)}`,
    modelId: getMockStringId(1),
    groupType: OccupationGroupType.ISCOGroup,
    originUri: `originUri_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationGroupRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationGroupRepository: IOccupationGroupRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationGroupRepository.mockReturnValue(mockOccupationGroupRepository);
}

describe("OccupationGroupsDoc2csvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should correctly transform OccupationGroup data to CSV", async () => {
    // GIVEN findAll returns a stream of OccupationGroups
    const givenOccupationGroups = getMockOccupationGroups();
    setupOccupationGroupRepositoryMock(() => Readable.from(givenOccupationGroups));

    // WHEN the transformation is applied
    const transformedStream = OccupationGroupsToCSVTransform("foo");

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
      // GIVEN that the source OccupationGroup stream will emit an error
      const givenError = new Error("Test Error");
      setupOccupationGroupRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = OccupationGroupsToCSVTransform("foo");
      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrow(givenError);

      // THEN the error should be logged
      const expectedErrorMessage = "Transforming ESCO occupationGroups to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );

      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the transformOccupationGroupSpecToCSVRow throws", async () => {
      // GIVEN findAll returns a stream of OccupationGroups
      setupOccupationGroupRepositoryMock(() => Readable.from(getMockOccupationGroups()));

      // AND  the transformOccupationGroupSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(OccupationGroupsToCSVTransformModule, "transformOccupationGroupSpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = OccupationGroupsToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform OccupationGroup to CSV row");

      // THEN the error should be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          `Failed to transform OccupationGroup to CSV row: ${expectedLoggedItem}`,
          givenError.message
        )
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          "Transforming ESCO occupationGroups to CSV failed",
          `Failed to transform OccupationGroup to CSV row: ${expectedLoggedItem}`
        )
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
