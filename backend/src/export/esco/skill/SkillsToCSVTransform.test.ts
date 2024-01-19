// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillRepository } from "esco/skill/skillRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import SkillsToCSVTransform, * as SKillsToCSVTransformModule from "./SkillsToCSVTransform";
import { IUnpopulatedSkill } from "./SkillsToCSVTransform";
import { parse } from "csv-parse/sync";
import { ReuseLevel, SkillType } from "esco/skill/skills.types";

const SkillRepository = jest.spyOn(getRepositoryRegistry(), "skill", "get");

const getMockSkills = (): IUnpopulatedSkill[] => {
  const getReuseLevel = (i: number) => {
    switch (i % 4) {
      case 0:
        return ReuseLevel.Transversal;
      case 1:
        return ReuseLevel.CrossSector;
      case 2:
        return ReuseLevel.OccupationSpecific;
      default:
        return ReuseLevel.SectorSpecific;
    }
  };
  return Array.from<never, IUnpopulatedSkill>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuidHistory_${i}_${getTestString(80)}`, `uuidHistory_${i + 1}_${getTestString(80)}`] : [],
    preferredLabel: `Skill_${i}_${getTestString(80)}`,
    altLabels: i % 2 ? [`altLabel_1_${getTestString(80)}`, `altLabel_2_${getTestString(80)}`] : [],
    description: `description_${i}_${getTestString(80)}`,
    definition: `definition_${i}_${getTestString(80)}`,
    modelId: getMockStringId(1),
    originUri: `originUri_${i}_${getTestString(80)}`,
    scopeNote: `scopeNote_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    skillType: i % 2 ? SkillType.SkillCompetence : SkillType.Knowledge,
    reuseLevel: getReuseLevel(i),
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupSkillRepositoryMock(findAllImpl: () => Readable) {
  const mockSkillRepository: ISkillRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  SkillRepository.mockReturnValue(mockSkillRepository);
}

describe("SkillsDocToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should correctly transform Skill data to CSV", async () => {
    // GIVEN findAll returns a stream of Skills
    const givenSkills = getMockSkills();
    setupSkillRepositoryMock(() => Readable.from(givenSkills));

    // WHEN the transformation is applied
    const transformedStream = SkillsToCSVTransform("foo");

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
      // GIVEN that the source Skill stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = SkillsToCSVTransform("foo");
      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrow(givenError);
      // AND the error to be logged
      const expectedErrorMessage = "Transforming Skills to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the transformSkillSpecToCSVRow throws", async () => {
      // GIVEN findAll will return a stream of Skills
      setupSkillRepositoryMock(() => Readable.from(getMockSkills()));
      // AND  the transformISCOSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(SKillsToCSVTransformModule, "transformSkillSpecToCSVRow")
        .mockImplementationOnce((_: IUnpopulatedSkill) => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = SkillsToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform Skill to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
      const expectedErrorMessage = `Failed to transform Skill to CSV row: ${expectedLoggedItem}`;
      const expectedError = new Error(expectedErrorMessage, { cause: givenError });

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("Transforming Skills to CSV failed", expectedError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
