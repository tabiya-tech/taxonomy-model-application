// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroupRepository } from "esco/skillGroup/skillGroupRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import SkillGroupsToCSVTransform, * as SKillGroupsToCSVTransformModule from "./SkillGroupsToCSVTransform";
import { IUnpopulatedSkillGroup } from "./SkillGroupsToCSVTransform";
import { parse } from "csv-parse/sync";

const SkillGroupRepository = jest.spyOn(getRepositoryRegistry(), "skillGroup", "get");

const getMockSkillGroups = (): IUnpopulatedSkillGroup[] => {
  return Array.from<never, IUnpopulatedSkillGroup>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuidHistory_1_${getTestString(80)}`, `uuidHistory_2_${getTestString(80)}`] : [],
    code: `code_${i}`,
    preferredLabel: `SkillGroup_${i}_${getTestString(80)}`,
    altLabels: i % 2 ? [`altLabel_1_${getTestString(80)}`, `altLabel_2_${getTestString(80)}`] : [],
    description: `description_${i}_${getTestString(80)}`,
    modelId: getMockStringId(1),
    ESCOUri: `ESCOUri_${i}_${getTestString(80)}`,
    scopeNote: `scopeNote_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupSkillGroupRepositoryMock(findAllImpl: () => Readable) {
  const mockSkillGroupRepository: ISkillGroupRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  SkillGroupRepository.mockReturnValue(mockSkillGroupRepository);
}

describe("SkillGroupsDocToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should correctly transform SkillGroup data to CSV", async () => {
    // GIVEN findAll returns a stream of SkillGroups
    const givenSkillGroups = getMockSkillGroups();
    setupSkillGroupRepositoryMock(() => Readable.from(givenSkillGroups));

    // WHEN the transformation is applied
    const transformedStream = SkillGroupsToCSVTransform("foo");

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
      // GIVEN that the source SkillGroup stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillGroupRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = SkillGroupsToCSVTransform("foo");
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

    test("should log an error and end the stream when the transformSkillGroupSpecToCSVRow throws", async () => {
      // GIVEN findAll will return a stream of SkillGroups
      setupSkillGroupRepositoryMock(() => Readable.from(getMockSkillGroups()));
      // AND  the transformISCOGroupSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      jest.spyOn(SKillGroupsToCSVTransformModule, "transformSkillGroupSpecToCSVRow").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN the transformation stream is consumed
      const transformedStream = SkillGroupsToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform SkillGroup to CSV row");
      // AND the error to be logged
      expect(console.error).toHaveBeenNthCalledWith(1, expect.any(Error), expect.any(Error));
      expect(console.error).toHaveBeenNthCalledWith(2, expect.any(Error), expect.any(Error));
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
