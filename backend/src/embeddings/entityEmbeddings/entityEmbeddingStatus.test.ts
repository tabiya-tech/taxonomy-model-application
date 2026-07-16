// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { Connection } from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import {
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { EntityEmbeddingStatus, IEmbeddableEntityRepository } from "./entityEmbedding.types";

/**
 * The entity-type-specific operations needed to test the embedding status methods
 * of every embeddable entity repository with the exact same flow.
 */
interface IEntityRepositoryTestCase {
  entityName: string;
  getRepository: (registry: RepositoryRegistry) => IEmbeddableEntityRepository;
  createEntity: (registry: RepositoryRegistry, modelId: string, preferredLabel: string) => Promise<string>;
  findEmbeddingStatus: (
    registry: RepositoryRegistry,
    entityId: string
  ) => Promise<Map<string, EntityEmbeddingStatus> | undefined>;
  deleteAllEntities: (registry: RepositoryRegistry) => Promise<unknown>;
}

const testCases: IEntityRepositoryTestCase[] = [
  {
    entityName: "skill",
    getRepository: (registry) => registry.skill,
    createEntity: async (registry, modelId, preferredLabel) =>
      (await registry.skill.create(getSimpleNewSkillSpec(modelId, preferredLabel))).id,
    findEmbeddingStatus: async (registry, entityId) =>
      (await registry.skill.Model.findById(entityId).exec())?.embeddingStatus,
    deleteAllEntities: (registry) => registry.skill.Model.deleteMany({}).exec(),
  },
  {
    entityName: "skillGroup",
    getRepository: (registry) => registry.skillGroup,
    createEntity: async (registry, modelId, preferredLabel) =>
      (await registry.skillGroup.create(getSimpleNewSkillGroupSpec(modelId, preferredLabel))).id,
    findEmbeddingStatus: async (registry, entityId) =>
      (await registry.skillGroup.Model.findById(entityId).exec())?.embeddingStatus,
    deleteAllEntities: (registry) => registry.skillGroup.Model.deleteMany({}).exec(),
  },
  {
    entityName: "occupation",
    getRepository: (registry) => registry.occupation,
    createEntity: async (registry, modelId, preferredLabel) =>
      (await registry.occupation.create(getSimpleNewESCOOccupationSpec(modelId, preferredLabel))).id,
    findEmbeddingStatus: async (registry, entityId) =>
      (await registry.occupation.Model.findById(entityId).exec())?.embeddingStatus,
    deleteAllEntities: (registry) => registry.occupation.Model.deleteMany({}).exec(),
  },
  {
    entityName: "occupationGroup",
    getRepository: (registry) => registry.OccupationGroup,
    createEntity: async (registry, modelId, preferredLabel) =>
      (await registry.OccupationGroup.create(getSimpleNewISCOGroupSpec(modelId, preferredLabel))).id,
    findEmbeddingStatus: async (registry, entityId) =>
      (await registry.OccupationGroup.Model.findById(entityId).exec())?.embeddingStatus,
    deleteAllEntities: (registry) => registry.OccupationGroup.Model.deleteMany({}).exec(),
  },
];

describe.each(testCases)(
  "Test the embedding status methods of the $entityName repository with an in-memory mongodb",
  ({ entityName, getRepository, createEntity, findEmbeddingStatus, deleteAllEntities }) => {
    const givenEmbeddingServiceId = "77bb8ff3-a6b0-460b-bcaa-00631a907852";

    let dbConnection: Connection;
    let repositoryRegistry: RepositoryRegistry;
    let repository: IEmbeddableEntityRepository;

    beforeAll(async () => {
      const config = getTestConfiguration(`${entityName}EmbeddingStatusTestDB`);
      dbConnection = await getNewConnection(config.dbURI);
      repositoryRegistry = new RepositoryRegistry();
      await repositoryRegistry.initialize(dbConnection);
      repository = getRepository(repositoryRegistry);
    });

    afterAll(async () => {
      if (dbConnection) {
        await dbConnection.dropDatabase();
        await dbConnection.close(false);
      }
    });

    beforeEach(async () => {
      await deleteAllEntities(repositoryRegistry);
    });

    describe("Test setEntityEmbeddingStatus", () => {
      test("should set the embedding status of the entity for the embedding service", async () => {
        // GIVEN an entity in the database without any embedding status
        const givenModelId = getMockStringId(1);
        const givenEntityId = await createEntity(repositoryRegistry, givenModelId, "Entity 1");

        // WHEN setting the embedding status of the entity for the embedding service
        await repository.setEntityEmbeddingStatus({
          modelId: givenModelId,
          entityId: givenEntityId,
          embeddingServiceId: givenEmbeddingServiceId,
          status: EntityEmbeddingStatus.IN_PROGRESS,
        });

        // THEN expect the status to be stored on the entity under the embedding service id
        const actualEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenEntityId);
        expect(actualEmbeddingStatus!.get(givenEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.IN_PROGRESS);
      });

      test("should overwrite the embedding status of the entity for the same embedding service", async () => {
        // GIVEN an entity in the database with an IN_PROGRESS embedding status for the embedding service
        const givenModelId = getMockStringId(1);
        const givenEntityId = await createEntity(repositoryRegistry, givenModelId, "Entity 1");
        const givenStatusSpec = {
          modelId: givenModelId,
          entityId: givenEntityId,
          embeddingServiceId: givenEmbeddingServiceId,
        };
        await repository.setEntityEmbeddingStatus({
          ...givenStatusSpec,
          status: EntityEmbeddingStatus.IN_PROGRESS,
        });

        // WHEN setting the embedding status of the entity to COMPLETED
        await repository.setEntityEmbeddingStatus({
          ...givenStatusSpec,
          status: EntityEmbeddingStatus.COMPLETED,
        });

        // THEN expect the status to have been overwritten
        const actualEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenEntityId);
        expect(actualEmbeddingStatus!.get(givenEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.COMPLETED);
      });

      test("should keep the embedding status of the entity for a different embedding service", async () => {
        // GIVEN an entity in the database with a COMPLETED embedding status for another embedding service
        const givenModelId = getMockStringId(1);
        const givenOtherEmbeddingServiceId = "00000000-0000-0000-0000-000000000000";
        const givenEntityId = await createEntity(repositoryRegistry, givenModelId, "Entity 1");
        await repository.setEntityEmbeddingStatus({
          modelId: givenModelId,
          entityId: givenEntityId,
          embeddingServiceId: givenOtherEmbeddingServiceId,
          status: EntityEmbeddingStatus.COMPLETED,
        });

        // WHEN setting the embedding status of the entity for the embedding service
        await repository.setEntityEmbeddingStatus({
          modelId: givenModelId,
          entityId: givenEntityId,
          embeddingServiceId: givenEmbeddingServiceId,
          status: EntityEmbeddingStatus.PENDING,
        });

        // THEN expect the entity to have both statuses
        const actualEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenEntityId);
        expect(actualEmbeddingStatus!.get(givenOtherEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.COMPLETED);
        expect(actualEmbeddingStatus!.get(givenEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.PENDING);
      });

      test("should not set the embedding status of an entity of a different model", async () => {
        // GIVEN an entity of a different model in the database
        const givenModelId = getMockStringId(1);
        const givenOtherModelId = getMockStringId(2);
        const givenEntityId = await createEntity(repositoryRegistry, givenOtherModelId, "Entity 1");

        // WHEN setting the embedding status of the entity scoped to the given model
        await repository.setEntityEmbeddingStatus({
          modelId: givenModelId,
          entityId: givenEntityId,
          embeddingServiceId: givenEmbeddingServiceId,
          status: EntityEmbeddingStatus.IN_PROGRESS,
        });

        // THEN expect the entity to not have been touched
        const actualEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenEntityId);
        expect(actualEmbeddingStatus).toBeUndefined();
      });
    });

    describe("Test setModelEntitiesEmbeddingStatus", () => {
      test("should set the embedding status of all the entities of the model and only those", async () => {
        // GIVEN two entities of a model and one entity of another model in the database
        const givenModelId = getMockStringId(1);
        const givenOtherModelId = getMockStringId(2);
        const givenEntity1Id = await createEntity(repositoryRegistry, givenModelId, "Entity 1");
        const givenEntity2Id = await createEntity(repositoryRegistry, givenModelId, "Entity 2");
        const givenOtherModelEntityId = await createEntity(repositoryRegistry, givenOtherModelId, "Entity 3");

        // WHEN setting the embedding status of all the entities of the model
        await repository.setModelEntitiesEmbeddingStatus({
          modelId: givenModelId,
          embeddingServiceId: givenEmbeddingServiceId,
          status: EntityEmbeddingStatus.PENDING,
        });

        // THEN expect both entities of the model to have the status
        for (const givenEntityId of [givenEntity1Id, givenEntity2Id]) {
          const actualEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenEntityId);
          expect(actualEmbeddingStatus!.get(givenEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.PENDING);
        }
        // AND expect the entity of the other model to not have been touched
        const actualOtherModelEmbeddingStatus = await findEmbeddingStatus(repositoryRegistry, givenOtherModelEntityId);
        expect(actualOtherModelEmbeddingStatus).toBeUndefined();
      });
    });
  }
);
