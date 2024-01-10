// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { OccupationType, RelationType } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import occupationToSkillRelationToCSVTransform, {
  IUnpopulatedOccupationToSkillRelation,
} from "./occupationToSkillRelationToCSVTransform";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import * as occupationToSkillRelationToCSVTransformModule from "./occupationToSkillRelationToCSVTransform";
import { parse } from "csv-parse/sync";

const OccupationToSkillRelationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get");

const getMockOccupationToSkillRelations = (): IUnpopulatedOccupationToSkillRelation[] => {
  function getOccupationType(i: number) {
    switch (i % 3) {
      case 0:
        return OccupationType.ESCO;
      case 1:
        return OccupationType.LOCAL;
      case 2:
        return OccupationType.LOCALIZED;
      default:
        throw new Error("Invalid number");
    }
  }

  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    requiringOccupationId: getMockStringId(i * 3 + 1),
    requiredSkillId: getMockStringId(i * 3 + 2),
    requiringOccupationType: getOccupationType(i),
    relationType: i % 2 ? RelationType.ESSENTIAL : RelationType.OPTIONAL,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationToSkillRelationRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationToSkillRelationRepository: IOccupationToSkillRelationRepository = {
    relationModel: undefined as never,
    occupationModel: undefined as never,
    localizedOccupationModel: undefined as never,
    skillModel: undefined as never,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationToSkillRelationRepositorySpy.mockReturnValue(mockOccupationToSkillRelationRepository);
}

describe("occupationToSkillRelationToCSVTransform", () => {
  test("should correctly transform occupationToSkillRelation data to CSV", async () => {
    // GIVEN findAll returns a stream of occupationToSkillRelations
    const givenRelations = getMockOccupationToSkillRelations();
    setupOccupationToSkillRelationRepositoryMock(() => Readable.from(givenRelations));

    // WHEN the transformation is applied
    const transformedStream = occupationToSkillRelationToCSVTransform("foo");

    // THEN expect the output to be a valid CSV
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the given occupationToSkillRelation data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();
    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  describe("handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source occupationToSkillRelation stream will emit an error
      const givenError = new Error("Test Error");
      setupOccupationToSkillRelationRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = occupationToSkillRelationToCSVTransform("foo");

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
      // GIVEN findAll returns a stream of occupationToSkillRelations
      setupOccupationToSkillRelationRepositoryMock(() => Readable.from(getMockOccupationToSkillRelations()));

      // AND  the transformOccupationToSkillRelationSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest
        .spyOn(occupationToSkillRelationToCSVTransformModule, "transformOccupationToSkillRelationSpecToCSVRow")
        .mockImplementationOnce(
          () => {
            throw givenError;
          }
        );

      // WHEN the transformation stream is consumed
      const transformedStream = occupationToSkillRelationToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform occupationToSkillRelation to CSV row");
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
