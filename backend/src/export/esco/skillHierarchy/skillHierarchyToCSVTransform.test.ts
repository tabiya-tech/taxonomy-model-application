// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import skillHierarchyToCSVTransform, * as skillHierarchyToCSVTransformModule from "./skillHierarchyToCSVTransform";
import { IUnpopulatedSkillHierarchy } from "./skillHierarchyToCSVTransform";
import { ISkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import { parse } from "csv-parse/sync";

const SkillHierarchyRepositorySpy = jest.spyOn(getRepositoryRegistry(), "skillHierarchy", "get");

const getMockSkillHierarchies = (): IUnpopulatedSkillHierarchy[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    parentId: getMockStringId(i * 3 + 1),
    childId: getMockStringId(i * 3 + 2),
    parentType: i % 2 ? ObjectTypes.Skill : ObjectTypes.SkillGroup,
    childType: i % 2 ? ObjectTypes.SkillGroup : ObjectTypes.Skill,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupSkillHierarchyRepositoryMock(findAllImpl: () => Readable) {
  const mockSkillHierarchyRepository: ISkillHierarchyRepository = {
    hierarchyModel: undefined as any,
    skillModel: undefined as any,
    skillGroupModel: undefined as any,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  SkillHierarchyRepositorySpy.mockReturnValue(mockSkillHierarchyRepository);
}

describe("skillHierarchyToCSVTransform", () => {
  test("should correctly transform skillHierarchy data to CSV", async () => {
    // GIVEN findAll returns a stream of skillHierarchies
    const givenHierarchies = getMockSkillHierarchies();
    setupSkillHierarchyRepositoryMock(() => Readable.from(givenHierarchies));

    // WHEN the transformation is applied
    const transformedStream = skillHierarchyToCSVTransform("foo");

    // THEN expect the output to be a valid CSV
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the given skillHierarchy data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();
    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  describe("handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source skillHierarchy stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillHierarchyRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = skillHierarchyToCSVTransform("foo");

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
      // GIVEN findAll returns a stream of skillHierarchies
      setupSkillHierarchyRepositoryMock(() => Readable.from(getMockSkillHierarchies()));

      // AND  the transformSkillHierarchySpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest
        .spyOn(skillHierarchyToCSVTransformModule, "transformSkillHierarchySpecToCSVRow")
        .mockImplementationOnce((_: skillHierarchyToCSVTransformModule.IUnpopulatedSkillHierarchy) => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = skillHierarchyToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform SkillHierarchy to CSV row");
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
