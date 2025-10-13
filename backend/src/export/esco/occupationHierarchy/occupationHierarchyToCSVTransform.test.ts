// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import occupationHierarchyToCSVTransform, * as occupationHierarchyToCSVTransformModule from "./occupationHierarchyToCSVTransform";
import {
  IUnpopulatedOccupationHierarchy,
  transformOccupationHierarchySpecToCSVRow,
} from "./occupationHierarchyToCSVTransform";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import { parse } from "csv-parse/sync";
import {
  OccupationHierarchyChildType,
  OccupationHierarchyParentType,
} from "esco/occupationHierarchy/occupationHierarchy.types";

const OccupationHierarchyRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupationHierarchy", "get");

const getMockOccupationHierarchies = (): IUnpopulatedOccupationHierarchy[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    parentId: getMockStringId(i * 3 + 1),
    childId: getMockStringId(i * 3 + 2),
    parentType: i % 3 === 0 ? ObjectTypes.ESCOOccupation : i % 3 === 1 ? ObjectTypes.ISCOGroup : ObjectTypes.LocalGroup,
    childType: i % 2 ? ObjectTypes.LocalOccupation : ObjectTypes.ESCOOccupation,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationHierarchyRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationHierarchyRepository: IOccupationHierarchyRepository = {
    hierarchyModel: undefined as never,
    occupationModel: undefined as never,
    occupationGroupModel: undefined as never,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationHierarchyRepositorySpy.mockReturnValue(mockOccupationHierarchyRepository);
}

describe("occupationHierarchyToCSVTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("test transformOccupationHierarchySpecToCSVRow()", () => {
    test("should transform a OccupationHierarchy to a CSV row", () => {
      // GIVEN a valid OccupationHierarchy
      const givenOccupationHierarchy = getMockOccupationHierarchies()[0];
      // WHEN the Occupation is transformed
      const actualRow = transformOccupationHierarchySpecToCSVRow(givenOccupationHierarchy);
      // THEN the CSV row should be correct
      expect(actualRow).toMatchSnapshot();
    });

    test("should throw an error when the parentType is unknown", async () => {
      // GIVEN an otherwise valid OccupationHierarchy
      const givenOccupationHierarchy = getMockOccupationHierarchies()[0];
      // WITH an unknown parentType
      givenOccupationHierarchy.parentType = "foo" as OccupationHierarchyParentType;
      // WHEN the Occupation is transformed
      const transformCall = () => transformOccupationHierarchySpecToCSVRow(givenOccupationHierarchy);
      // THEN the transformation should throw an error
      expect(transformCall).toThrowError("Failed to transform OccupationHierarchy to CSV row: Invalid parentType: foo");
    });

    test("should throw an error when the childType is unknown", async () => {
      // GIVEN an otherwise valid OccupationHierarchy
      const givenOccupationHierarchy = getMockOccupationHierarchies()[0];
      // WITH an unknown childType
      givenOccupationHierarchy.childType = "foo" as OccupationHierarchyChildType;
      // WHEN the Occupation is transformed
      const transformCall = () => transformOccupationHierarchySpecToCSVRow(givenOccupationHierarchy);
      // THEN the transformation should throw an error
      expect(transformCall).toThrowError("Failed to transform OccupationHierarchy to CSV row: Invalid childType: foo");
    });
  });

  test("should correctly transform occupationHierarchy data to CSV", async () => {
    // GIVEN findAll returns a stream of occupationHierarchies
    const givenHierarchies = getMockOccupationHierarchies();
    setupOccupationHierarchyRepositoryMock(() => Readable.from(givenHierarchies));

    // WHEN the transformation is applied
    const transformedStream = occupationHierarchyToCSVTransform("foo");

    // THEN expect the output to be a valid CSV
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the given occupationHierarchy data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();
    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  describe("handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source occupationHierarchy stream will emit an error
      const givenError = new Error("Test Error");
      setupOccupationHierarchyRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = occupationHierarchyToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError(givenError);
      // AND the error should be logged
      const expectedErrorMessage = "Transforming OccupationHierarchy to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the CSV stringifier fails", async () => {
      // GIVEN findAll returns a stream of occupationHierarchys
      setupOccupationHierarchyRepositoryMock(() => Readable.from(getMockOccupationHierarchies()));

      // AND  the transformOccupationHierarchySpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(occupationHierarchyToCSVTransformModule, "transformOccupationHierarchySpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = occupationHierarchyToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform OccupationHierarchy to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
      const expectedErrorMessage = `Failed to transform OccupationHierarchy to CSV row: ${expectedLoggedItem}`;

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
