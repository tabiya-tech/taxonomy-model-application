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

const SkillToSkillRelationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "skillToSkillRelation", "get");

const getMockSkillToSkillRelations = (): IUnpopulatedSkillToSkillRelation[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    requiringSkillId: getMockStringId(i * 3 + 1),
    requiredSkillId: getMockStringId(i * 3 + 2),
    relationType: i % 2 ? RelationType.ESSENTIAL : RelationType.OPTIONAL,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupSkillToSkillRelationRepositoryMock(findAllImpl: () => Readable) {
  const mockSkillToSkillRelationRepository: ISkillToSkillRelationRepository = {
    relationModel: undefined as never,
    skillModel: undefined as never,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  SkillToSkillRelationRepositorySpy.mockReturnValue(mockSkillToSkillRelationRepository);
}

describe("skillToSkillRelationToCSVTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("test transformSkillRelationSpecToCSVRow()", () => {
    test("should transform a SkillToSkillRelation to a CSV row", () => {
      // GIVEN a valid SkillToSkillRelation
      const givenSkillToSkillRelation = getMockSkillToSkillRelations()[0];
      // WHEN the SkillToSkillRelation is transformed
      const transformedRow =
        skillToSkillRelationToCSVTransformModule.transformSkillRelationSpecToCSVRow(givenSkillToSkillRelation);
      // THEN expect the transformed row to match the snapshot
      expect(transformedRow).toMatchSnapshot();
    });
    test("should throw an error when the relationType is unknown", () => {
      // GIVEN an invalid SkillToSkillRelation
      const givenSkillToSkillRelation = getMockSkillToSkillRelations()[0];
      givenSkillToSkillRelation.relationType = "unknown" as RelationType;
      // WHEN the SkillToSkillRelation is transformed
      // THEN expect the transformation to throw an error
      expect(() => {
        skillToSkillRelationToCSVTransformModule.transformSkillRelationSpecToCSVRow(givenSkillToSkillRelation);
      }).toThrowErrorMatchingSnapshot();
    });
  });

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
      const expectedErrorMessage = "Transforming SkillToSkillRelation to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the CSV stringifier fails", async () => {
      // GIVEN findAll returns a stream of skillToSkillRelations
      setupSkillToSkillRelationRepositoryMock(() => Readable.from(getMockSkillToSkillRelations()));

      // AND  the transformSkillRelationSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(skillToSkillRelationToCSVTransformModule, "transformSkillRelationSpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = SkillToSkillRelationToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform SkillToSkillRelation to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
      const expectedErrorMessage = `Failed to transform SkillToSkillRelation to CSV row: ${expectedLoggedItem}`;
      const expectedError = new Error(expectedErrorMessage, { cause: givenError });

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("Transforming SkillToSkillRelation to CSV failed", expectedError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
