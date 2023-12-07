// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import occupationHierarchyToCSVTransform, * as occupationHierarchyToCSVTransformModule from "./occupationHierarchyToCSVTransform";
import { IUnpopulatedOccupationHierarchy } from "./occupationHierarchyToCSVTransform";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import { parse } from "csv-parse/sync";

const OccupationHierarchyRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupationHierarchy", "get");

const getMockOccupationHierarchies = (): IUnpopulatedOccupationHierarchy[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    parentId: getMockStringId(i * 3 + 1),
    childId: getMockStringId(i * 3 + 2),
    parentType: i % 2 ? ObjectTypes.Occupation : ObjectTypes.ISCOGroup,
    childType: i % 2 ? ObjectTypes.ISCOGroup : ObjectTypes.Occupation,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

function setupOccupationHierarchyRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationHierarchyRepository: IOccupationHierarchyRepository = {
    hierarchyModel: undefined as any,
    occupationModel: undefined as any,
    iscoGroupModel: undefined as any,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationHierarchyRepositorySpy.mockReturnValue(mockOccupationHierarchyRepository);
}

describe("occupationHierarchyToCSVTransform", () => {
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
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the CSV stringifier fails", async () => {
      // GIVEN findAll returns a stream of occupationHierarchys
      setupOccupationHierarchyRepositoryMock(() => Readable.from(getMockOccupationHierarchies()));

      // AND  the transformOccupationHierarchySpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest
        .spyOn(occupationHierarchyToCSVTransformModule, "transformOccupationHierarchySpecToCSVRow")
        .mockImplementationOnce((_: occupationHierarchyToCSVTransformModule.IUnpopulatedOccupationHierarchy) => {
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
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
