// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import SkillToSkillRelationToCSVTransform, {
  IUnpopulatedSkillToSkillRelation,
} from "./skillToSkillRelationToCSVTransform";
import { RelationType } from "esco/common/objectTypes";
import { Readable } from "stream";
import { ISkillToSkillRelationRepository } from "esco/skillToSkillRelation/skillToSkillRelationRepository";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { parse } from "csv-parse/sync";
import * as skillToSkillRelationToCSVTransformModule from "./skillToSkillRelationToCSVTransform";
import skillToSkillRelationToCSVTransform from "./skillToSkillRelationToCSVTransform";

const SkillToSkillRelationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "skillToSkillRelation", "get");

const getMockSkillToSkillRelations = (): IUnpopulatedSkillToSkillRelation[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    requiringSkillId: getMockStringId(i * 3 + 1),
    requiredSkillId: getMockStringId(i * 3 + 2),
    relationType: i % 2 ? RelationType.ESSENTIAL : RelationType.OPTIONAL,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

function setupSkillToSkillRelationRepositoryMock(findAllImpl: () => Readable) {
  const mockSkillToSkillRelationRepository: ISkillToSkillRelationRepository = {
    relationModel: undefined as any,
    skillModel: undefined as any,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  SkillToSkillRelationRepositorySpy.mockReturnValue(mockSkillToSkillRelationRepository);
}

describe("skillToSkillRelationToCSVTransform", () => {
  test("should correctly transform skillToSkillRelation data to CSV", async () => {
    // GIVEN findAll returns a stream of skillToSkillRelations
    const givenRelations = getMockSkillToSkillRelations();
    setupSkillToSkillRelationRepositoryMock(() => Readable.from(givenRelations));

    // WHEN the transformation is applied
    const transformedStream = SkillToSkillRelationToCSVTransform("foo");

    // THEN expect the output to be a valid CSV
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the given skillToSkillRelation data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();
    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  describe("handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source skillToSkillRelation stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillToSkillRelationRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = SkillToSkillRelationToCSVTransform("foo");

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
      // GIVEN findAll returns a stream of skillToSkillRelations
      setupSkillToSkillRelationRepositoryMock(() => Readable.from(getMockSkillToSkillRelations()));

      // AND  the transformSkillRelationSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest
        .spyOn(skillToSkillRelationToCSVTransformModule, "transformSkillRelationSpecToCSVRow")
        .mockImplementationOnce((_: skillToSkillRelationToCSVTransformModule.IUnpopulatedSkillToSkillRelation) => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = skillToSkillRelationToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform SkillToSkillRelation to CSV row");
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});