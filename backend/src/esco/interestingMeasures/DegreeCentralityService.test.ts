// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

import { Readable } from "node:stream";
import { Connection } from "mongoose";
import { ISkillRepository } from "esco/skill/skillRepository";
import { INewSkillSpec, ISkill } from "esco/skill/skills.types";
import { getNewConnection } from "server/connection/newConnection";
import { generateRandomNumber } from "_test_utilities/specialCharacters";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { BatchProcessor } from "import/batch/BatchProcessor";

import {
  INewOccupationToSkillPairSpec,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { DegreeCentralityService, ISkillConnection } from "esco/interestingMeasures/DegreeCentralityService";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import {
  getNewSkillSpec,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";

describe("DegreeCentralityService", () => {
  let dbConnection: Connection;
  let skillRepository: ISkillRepository;
  let occupationToSkillRelationRepository: IOccupationToSkillRelationRepository;
  let repositoryRegistry: RepositoryRegistry;
  let service: DegreeCentralityService;

  beforeAll(async () => {
    const config = getTestConfiguration("DegreeCentralityService");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    skillRepository = repositoryRegistry.skill;
    occupationToSkillRelationRepository = repositoryRegistry.occupationToSkillRelation;

    service = new DegreeCentralityService(
      repositoryRegistry.skill.Model,
      repositoryRegistry.occupationToSkillRelation.relationModel
    );
  });

  async function createOccupationToSkillRelationsInDB(modelId: string, batchSize: number = 3) {
    const newOccupationToSkillPairSpecs: INewOccupationToSkillPairSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      const occupation = await repositoryRegistry.occupation.create(getSimpleNewESCOOccupationSpec(modelId, "skill_1"));
      const skill = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(modelId, "skill_2"));
      newOccupationToSkillPairSpecs.push({
        requiringOccupationId: occupation.id,
        signallingValue: null,
        relationType: OccupationToSkillRelationType.OPTIONAL,
        requiredSkillId: skill.id,
        requiringOccupationType: ObjectTypes.ESCOOccupation,
        signallingValueLabel: SignallingValueLabel.NONE,
      });
    }
    return await occupationToSkillRelationRepository.createMany(modelId, newOccupationToSkillPairSpecs);
  }

  async function deleteAllOccupationToSkillRelations() {
    await occupationToSkillRelationRepository.relationModel.deleteMany({});
  }

  describe("Test updateSkillDegreeCentrality() ", () => {
    test("should successfully update the degree centrality of the existing skills", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
      }

      // AND skills are created
      const givenCreatedSkills: ISkill[] = await skillRepository.createMany(givenNewSkillSpecs);

      // AND updating the degree centrality of the skills
      const actualSkillsConnections: ISkillConnection[] = [];
      for (const skill of givenCreatedSkills) {
        actualSkillsConnections.push({
          skillId: skill.id,
          edges: generateRandomNumber(0, 10),
        });
      }

      // WHEN updating the degree centrality of the skills
      const actualResponse = await service.updateSkillDegreeCentrality(actualSkillsConnections);

      // THEN modified rows should be equal to provided skills connection.
      expect(actualResponse.rowsSuccess).toEqual(actualSkillsConnections.length);

      // THEN For each skill, the degree centrality should be updated
      for (const skill of givenCreatedSkills) {
        const actualSkill = await skillRepository.findById(skill.id);

        expect(actualSkill!.degreeCentrality).toEqual(
          actualSkillsConnections.find((s) => s.skillId === skill.id)!.edges
        );
      }
    });

    test("should not fail for an empty array of skills connection", async () => {
      // GIVEN an empty array of skills connections
      const givenSkillsConnections: ISkillConnection[] = [];

      // WHEN updating the degree centrality of the skills
      const actualResponse = await service.updateSkillDegreeCentrality(givenSkillsConnections);

      // THEN modified rows should be equal to 0
      expect(givenSkillsConnections.length).toEqual(actualResponse.rowsSuccess);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN that an error will occur when updating the degree centrality of the skills
      const givenError = new Error("foo");
      jest.spyOn(repositoryRegistry.skill.Model, "bulkWrite").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN updating the degree centrality of the skills
      const actualOccupationToSkillRelations = service.updateSkillDegreeCentrality([]);

      // THEN expect the operation to fail with the given error
      await expect(actualOccupationToSkillRelations).rejects.toThrow(
        new Error("DegreeCentralityService.updateSkillDegreeCentrality: bulkWrite failed", { cause: givenError })
      );
    });

    test.each([
      {
        key: "less than the rowsProcessed",
        givenModifiedCount: 1,
        expectedResponse: {
          rowsProcessed: 3,
          rowsSuccess: 1,
          rowsFailed: 2,
        },
      },
      {
        key: "equal to the rowsProcessed",
        givenModifiedCount: 3,
        expectedResponse: {
          rowsProcessed: 3,
          rowsSuccess: 3,
          rowsFailed: 0,
        },
      },
    ])(
      "it should return the correct stats when modified count $key",
      async ({ givenModifiedCount, expectedResponse }) => {
        // GIVEN some valid SkillSpec
        const givenBatchSize = 3;

        const givenSkillConnection: ISkillConnection[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenSkillConnection.push({
            skillId: getMockStringId(i),
            edges: generateRandomNumber(0, 10),
          });
        }

        const bulkWrite = jest.spyOn(repositoryRegistry.skill.Model, "bulkWrite");

        bulkWrite.mockReturnValueOnce({
          modifiedCount: givenModifiedCount,
        } as never);

        // WHEN updating the degree centrality of the skills
        const actualResponse = await service.updateSkillDegreeCentrality(givenSkillConnection);

        // THEN expect the stats to be logged
        expect(actualResponse).toEqual(expectedResponse);
      }
    );
  });

  describe("Test aggregateDegreeCentralityData()", () => {
    test("should return a list of valid ISkillConnections when querried", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      // AND a set of occupationToSkill relations exist in the database
      const givenNewOccupationToSkillRelations = await createOccupationToSkillRelationsInDB(givenModelId);

      // AND some others exist for a different model
      await createOccupationToSkillRelationsInDB(getMockStringId(2));

      // WHEN finding all occupationToSkill relations for the given modelId
      const actualSkillConnections = service.aggregateDegreeCentralityData(givenModelId);

      // THEN expect all the occupationToSkill relations to be returned as a consumable stream
      const actualSkillConnectionsArray: ISkillConnection[] = [];
      for await (const data of actualSkillConnections) {
        actualSkillConnectionsArray.push(data);
      }

      // group by skillId
      const expectedSkillsConnectionsArray: ISkillConnection[] = [];
      for (const relation of givenNewOccupationToSkillRelations) {
        const found = expectedSkillsConnectionsArray.findIndex((item) => item.skillId === relation.requiredSkillId);
        if (found === -1) {
          expectedSkillsConnectionsArray.push({
            skillId: relation.requiredSkillId,
            edges: 1,
          });
        } else {
          expectedSkillsConnectionsArray[found].edges++;
        }
      }
      expect(actualSkillConnectionsArray).toIncludeSameMembers(expectedSkillsConnectionsArray);
    });

    test("should not return any entry when the given model does not have any occupationToSkill relations but other models does", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(3);

      // AND some occupationToSkill relations exist in the database for a different model
      const res = await createOccupationToSkillRelationsInDB(getMockStringId(4));

      console.log({
        givenmodelId: givenModelId,
        res,
      });

      // WHEN grouping by skillId for the given modelId
      const actualOccupationToSkillRelations = service.aggregateDegreeCentralityData(givenModelId);

      // THEN expect no skill connections to be returned
      const actualOccupationToSkillRelationsArray: ISkillConnection[] = [];

      for await (const data of actualOccupationToSkillRelations) {
        actualOccupationToSkillRelationsArray.push(data);
      }

      expect(actualOccupationToSkillRelationsArray).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN that an error will occur when retrieving data
      const givenError = new Error("foo");
      jest.spyOn(occupationToSkillRelationRepository.relationModel, "aggregate").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN grouping by skillId for some modelId
      const actualOccupationToSkillRelations = () => service.aggregateDegreeCentralityData(getMockStringId(1));

      // THEN expect the operation to fail with the given error
      expect(actualOccupationToSkillRelations).toThrow(
        expect.toMatchErrorWithCause(
          "DegreeCentralityService.updateSkillDegreeCentrality: aggregate failed",
          givenError.message
        )
      );
    });

    test("should end and emit an error if an error occurs during data retrieval in the upstream", async () => {
      // GIVEN that an error will occur during the streaming of data
      const givenError = new Error("foo");
      const mockStream = Readable.from([{ toObject: jest.fn() }]);
      mockStream._read = jest.fn().mockImplementation(() => {
        throw givenError;
      });
      const mockFind = jest.spyOn(occupationToSkillRelationRepository.relationModel, "aggregate");

      // @ts-ignore
      mockFind.mockReturnValue({
        cursor: jest.fn().mockReturnValueOnce(mockStream),
      });

      // WHEN grouping by skillId for some modelId
      const actualStream = service.aggregateDegreeCentralityData(getMockStringId(1));

      // THEN expect the operation to return a stream that emits an error
      const skillConnections: ISkillConnection[] = [];
      await expect(async () => {
        for await (const data of actualStream) {
          skillConnections.push(data);
        }
      }).rejects.toThrowError(givenError);

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(
          "DegreeCentralityService.updateSkillDegreeCentralit: stream failed",
          givenError.message
        )
      );

      expect(actualStream.closed).toBeTruthy();
      expect(skillConnections).toHaveLength(0);
      mockFind.mockRestore();
    });
  });

  describe("Test calculateDegreeCentrality", () => {
    const aggregateDegreeCentralityDataSpy = jest.spyOn(
      DegreeCentralityService.prototype,
      "aggregateDegreeCentralityData"
    );
    const updateSkillDegreeCentralitySpy = jest.spyOn(DegreeCentralityService.prototype, "updateSkillDegreeCentrality");

    beforeEach(async () => {
      aggregateDegreeCentralityDataSpy.mockClear();
      updateSkillDegreeCentralitySpy.mockClear();
      await deleteAllOccupationToSkillRelations();
    });

    it("should call both aggregateDegreeCentralityData and updateSkillDegreeCentrality", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      await createOccupationToSkillRelationsInDB(givenModelId);

      // WHEN calculating the degree centrality
      await service.calculateDegreeCentrality(givenModelId);

      // THEN expect both aggregateDegreeCentralityData and updateSkillDegreeCentrality to be called
      expect(aggregateDegreeCentralityDataSpy).toHaveBeenCalledTimes(1);
      expect(updateSkillDegreeCentralitySpy).toHaveBeenCalledTimes(1);
    });

    it("should log the stats after the operation", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      await createOccupationToSkillRelationsInDB(givenModelId);

      // WHEN calculating the degree centrality
      await service.calculateDegreeCentrality(givenModelId);

      // THEN expect the stats to be logged
      expect(console.info).toHaveBeenCalledWith(
        expect.objectContaining({
          rowsProcessed: expect.any(Number),
          rowsFailed: expect.any(Number),
          rowsSuccess: expect.any(Number),
        })
      );
    });

    it("should call update using the response from aggregate", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      const givenSkillConnections = [
        { skillId: "foo_1", edges: 1 },
        { skillId: "foo_2", edges: 2 },
        { skillId: "foo_3", edges: 3 },
      ];

      await createOccupationToSkillRelationsInDB(givenModelId);

      // WHEN calculating the degree centrality
      aggregateDegreeCentralityDataSpy.mockReturnValueOnce(Readable.from(givenSkillConnections));
      await service.calculateDegreeCentrality(givenModelId);

      // THEN expect the update to be called with the response from aggregate
      expect(updateSkillDegreeCentralitySpy).toHaveBeenCalledWith(givenSkillConnections);
    });

    it("should use BatchProcessor to update the degree centrality", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      const flush = jest.spyOn(BatchProcessor.prototype, "flush");

      const givenSkillConnections = [
        { skillId: "foo_1", edges: 1 },
        { skillId: "foo_2", edges: 2 },
        { skillId: "foo_3", edges: 3 },
      ];

      await createOccupationToSkillRelationsInDB(givenModelId);

      // WHEN calculating the degree centrality
      aggregateDegreeCentralityDataSpy.mockReturnValueOnce(Readable.from(givenSkillConnections));

      // WHEN calculating the degree centrality
      await service.calculateDegreeCentrality(givenModelId);

      // THEN expect the update to be called with the response from aggregate
      expect(updateSkillDegreeCentralitySpy).toHaveBeenCalledWith(givenSkillConnections);

      expect(flush).toHaveBeenCalledTimes(1);
    });

    it("should log any error if aggregateDegreeCentralityData throw an error", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);

      // AND aggregateDegreeCentralityData will throw an error
      aggregateDegreeCentralityDataSpy.mockImplementationOnce(() => {
        throw new Error("foo");
      });

      // THEN expect the operation to fail with the given error
      await expect(() => service.calculateDegreeCentrality(givenModelId)).rejects.toThrow(
        expect.toMatchErrorWithCause("DegreeCentralityService.calculateDegreeCentrality findById failed", "foo")
      );
    });
  });
});
