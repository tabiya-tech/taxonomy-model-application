import ImportAPISpecs from "api-specifications/import";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillConnection } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { updateSkillDegreeCentrality, calculateSkillDegreeCentrality } from "import/async/measures/degreeCentrallity";
import { Readable } from "node:stream";
import { BatchProcessor } from "../../batch/BatchProcessor";

describe("degreeCentrality", () => {
  describe("calculateSkillDegreeCentrality", () => {
    it("should call getRepositoryRegistry().occupationToSkillRelation.groupBySkillId to get a readable stream of skill connections", async () => {
      // GIVEN: An event object containing details for the import process
      const givenEvent = {
        modelId: getMockStringId(1),
      } as never as ImportAPISpecs.Types.POST.Request.Payload;

      // AND: getRepositoryRegistry().occupationToSkillRelation.groupBySkillId that returns a readable stream
      const repositoryGroupBySkillId = jest.fn().mockReturnValue(Readable.from([]));

      jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get").mockReturnValue({
        groupBySkillId: repositoryGroupBySkillId,
      } as never);

      // WHEN: We call calculateSkillDegreeCentrality with the given event
      await calculateSkillDegreeCentrality(givenEvent);

      // THEN: getRepositoryRegistry().occupationToSkillRelation.groupBySkillId should be called once
      expect(repositoryGroupBySkillId).toBeCalledTimes(1);
    });

    it("should initiate Batch Processor for handling the job", async () => {
      // GIVEN: An event object containing details for the import process
      const givenEvent = {
        modelId: getMockStringId(1),
      } as never as ImportAPISpecs.Types.POST.Request.Payload;

      const batchProcessorConstructor = jest.spyOn(BatchProcessor.prototype, "flush");

      // AND: getRepositoryRegistry().occupationToSkillRelation.groupBySkillId that returns a readable stream
      const repositoryGroupBySkillId = jest.fn().mockReturnValue(Readable.from([]));

      jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get").mockReturnValue({
        groupBySkillId: repositoryGroupBySkillId,
      } as never);

      // WHEN: We call calculateSkillDegreeCentrality with the given event
      await calculateSkillDegreeCentrality(givenEvent);

      // THEN: The Batch Processor should be initiated
      expect(batchProcessorConstructor).toBeCalledTimes(1);
    });

    it("should log the stats after the job is done", async () => {
      // GIVEN: An event object containing details for the import process
      const givenEvent = {
        modelId: getMockStringId(1),
      } as never as ImportAPISpecs.Types.POST.Request.Payload;

      const consoleInfo = jest.spyOn(console, "info");

      // AND: getRepositoryRegistry().occupationToSkillRelation.groupBySkillId that returns a readable stream
      const repositoryGroupBySkillId = jest.fn().mockReturnValue(Readable.from([]));

      jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get").mockReturnValue({
        groupBySkillId: repositoryGroupBySkillId,
      } as never);

      // WHEN: We call calculateSkillDegreeCentrality with the given event
      await calculateSkillDegreeCentrality(givenEvent);

      // THEN: The stats should be logged
      expect(consoleInfo).toBeCalledTimes(1);
    });
  });

  describe("updateSkillDegreeCentrality", () => {
    it("should call repositoryRegistry.skill.updateSkillDegreeCentrality with the given skills ", async () => {
      // GIVEN: An array of skills connections
      const givenSkills: ISkillConnection[] = [
        {
          skillId: "foo",
          edges: 10,
        },
      ];

      // AND repositoryRegistry.skill.updateSkillDegreeCentrality that returns a modifiedCount
      const repositoryUpdateSkillDegreeCentrality = jest.fn().mockResolvedValue({
        modifiedCount: givenSkills.length,
      });

      const givenSkillRepository = {
        updateSkillDegreeCentrality: repositoryUpdateSkillDegreeCentrality,
      } as never;

      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepository);

      // WHEN: We call updateSkillDegreeCentrality with the given skills
      await updateSkillDegreeCentrality(givenSkills);

      // THEN: repositoryRegistry.skill.updateSkillDegreeCentrality should be called with the given skills
      expect(repositoryUpdateSkillDegreeCentrality).toBeCalledTimes(givenSkills.length);
    });

    it("should return the number of rows processed, the number of rows successfully updated and the number of rows that failed", async () => {
      // GIVEN: An array of skills connections
      const BATCH_SIZE = 10;
      const givenSkillConnections: ISkillConnection[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        givenSkillConnections.push({
          skillId: getMockStringId(i),
          edges: i,
        });
      }

      const repositoryUpdateSkillDegreeCentrality = jest.fn().mockResolvedValue({
        modifiedCount: BATCH_SIZE,
      });

      const givenSkillRepository = {
        updateSkillDegreeCentrality: repositoryUpdateSkillDegreeCentrality,
      } as never;

      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepository);

      // WHEN: We call updateSkillDegreeCentrality with the given skills
      const result = await updateSkillDegreeCentrality(givenSkillConnections);

      // THEN: The result should be the number of rows processed, the number of rows successfully updated and the number of rows that failed
      expect(result).toEqual({
        rowsFailed: 0,
        rowsSuccess: BATCH_SIZE,
        rowsProcessed: BATCH_SIZE,
      });
    });

    it("should return the correct number of rows failed when not all rows were updated", async () => {
      // GIVEN: An array of skills connections
      const BATCH_SIZE = 10;
      const givenSkillConnections: ISkillConnection[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        givenSkillConnections.push({
          skillId: getMockStringId(i),
          edges: i,
        });
      }

      const repositoryUpdateSkillDegreeCentrality = jest.fn().mockResolvedValue({
        modifiedCount: BATCH_SIZE - 1,
      });

      const givenSkillRepository = {
        updateSkillDegreeCentrality: repositoryUpdateSkillDegreeCentrality,
      } as never;

      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepository);

      // WHEN: We call updateSkillDegreeCentrality with the given skills
      const result = await updateSkillDegreeCentrality(givenSkillConnections);

      // THEN: The result should be the number of rows processed, the number of rows successfully updated and the number of rows that failed
      expect(result).toEqual({
        rowsFailed: 1,
        rowsSuccess: BATCH_SIZE - 1,
        rowsProcessed: BATCH_SIZE,
      });
    });

    it("should return the correct number of rows failed when none of the rows were updated", async () => {
      // GIVEN: An array of skills connections
      const BATCH_SIZE = 10;
      const givenSkillConnections: ISkillConnection[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        givenSkillConnections.push({
          skillId: getMockStringId(i),
          edges: i,
        });
      }

      const repositoryUpdateSkillDegreeCentrality = jest.fn().mockResolvedValue({
        modifiedCount: 0,
      });

      const givenSkillRepository = {
        updateSkillDegreeCentrality: repositoryUpdateSkillDegreeCentrality,
      } as never;

      jest.spyOn(getRepositoryRegistry(), "skill", "get").mockReturnValue(givenSkillRepository);

      // WHEN: We call updateSkillDegreeCentrality with the given skills
      const result = await updateSkillDegreeCentrality(givenSkillConnections);

      // THEN: The result should be the number of rows processed, the number of rows successfully updated and the number of rows that failed
      expect(result).toEqual({
        rowsFailed: BATCH_SIZE,
        rowsSuccess: 0,
        rowsProcessed: BATCH_SIZE,
      });
    });
  });
});
