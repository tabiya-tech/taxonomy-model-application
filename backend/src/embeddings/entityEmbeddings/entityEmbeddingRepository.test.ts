// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { Connection } from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import { EmbeddableField } from "embeddings/service/types";
import { IEntityEmbeddingRepository } from "./entityEmbeddingRepository";
import { EntityEmbeddingIdPath, INewEntityEmbeddingSpec, ISkillEmbeddingDoc } from "./entityEmbedding.types";

function getNewEntityEmbeddingSpec(overrides: Partial<INewEntityEmbeddingSpec> = {}): INewEntityEmbeddingSpec {
  return {
    modelId: getMockStringId(1),
    entityId: getMockStringId(2),
    embeddingServiceId: "77bb8ff3-a6b0-460b-bcaa-00631a907852",
    sourceHash: "md5:5eb63bbbe01eeed093cb22bb8f5acdc3",
    sourceField: EmbeddableField.preferredLabel,
    sourceText: "some source text",
    vector: [0.1, 0.2, 0.3],
    ...overrides,
  };
}

function expectedFromGivenSpec(givenSpec: INewEntityEmbeddingSpec) {
  return {
    ...givenSpec,
    id: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe.each([
  ["skillEmbedding", EntityEmbeddingIdPath.skillId],
  ["skillGroupEmbedding", EntityEmbeddingIdPath.skillGroupId],
  ["occupationEmbedding", EntityEmbeddingIdPath.occupationId],
  ["occupationGroupEmbedding", EntityEmbeddingIdPath.occupationGroupId],
])(
  "Test the %s Repository with an in-memory mongodb",
  (registryKey: string, expectedEntityIdPath: EntityEmbeddingIdPath) => {
    let dbConnection: Connection;
    // The repositories of all the entity types share the same behavior, so the tests run against the shape
    // of one of them (the registry key is cast accordingly below).
    let repository: IEntityEmbeddingRepository<ISkillEmbeddingDoc>;

    beforeAll(async () => {
      const config = getTestConfiguration(`${registryKey}RepositoryTestDB`);
      dbConnection = await getNewConnection(config.dbURI);
      const repositoryRegistry = new RepositoryRegistry();
      await repositoryRegistry.initialize(dbConnection);
      repository = repositoryRegistry[registryKey as "skillEmbedding"];
    });

    afterAll(async () => {
      if (dbConnection) {
        await dbConnection.dropDatabase();
        await dbConnection.close(false);
      }
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should return the model and the entity id path", async () => {
      expect(repository.Model).toBeDefined();
      expect(repository.entityIdPath).toEqual(expectedEntityIdPath);
    });

    test("initOnce has registered the repository", async () => {
      // GIVEN that the mongodb uri should be set
      expect(process.env.MONGODB_URI).toBeDefined();

      // WHEN initOnce has been called
      await initOnce();

      // THEN expect the repository to be defined
      expect(getRepositoryRegistry()[registryKey as "skillEmbedding"]).toBeDefined();

      // Clean up
      await getConnectionManager().getCurrentDBConnection()!.close(false);
    });

    describe("Test upsert() entity embedding", () => {
      test("should successfully create a new entity embedding when there is none for the entity, service and field", async () => {
        // GIVEN a valid new entity embedding spec
        const givenNewEntityEmbeddingSpec = getNewEntityEmbeddingSpec();

        // WHEN upserting the entity embedding
        const actualEntityEmbedding = await repository.upsert(givenNewEntityEmbeddingSpec);

        // THEN expect the created entity embedding to match the given spec
        expect(actualEntityEmbedding).toEqual(expectedFromGivenSpec(givenNewEntityEmbeddingSpec));
        // AND expect the entity id to be stored in the database under the entity-specific path
        const actualDoc = await repository.Model.findById(actualEntityEmbedding.id).exec();
        expect(actualDoc!.get(expectedEntityIdPath)!.toString()).toEqual(givenNewEntityEmbeddingSpec.entityId);
      });

      test("should update the existing entity embedding when there is one for the entity, service and field", async () => {
        // GIVEN an entity embedding in the database
        const givenNewEntityEmbeddingSpec = getNewEntityEmbeddingSpec();
        const givenCreatedEntityEmbedding = await repository.upsert(givenNewEntityEmbeddingSpec);
        // AND a new spec for the same entity, service and field with a different hash, text and vector
        const givenUpdatedSpec = {
          ...givenNewEntityEmbeddingSpec,
          sourceHash: "md5:0000000000000000000000000000dead",
          sourceText: "some updated source text",
          vector: [0.4, 0.5, 0.6],
        };

        // WHEN upserting the updated spec
        const actualUpdatedEntityEmbedding = await repository.upsert(givenUpdatedSpec);

        // THEN expect the existing entity embedding to have been updated instead of a new one being created
        expect(actualUpdatedEntityEmbedding.id).toEqual(givenCreatedEntityEmbedding.id);
        expect(actualUpdatedEntityEmbedding).toEqual({
          ...expectedFromGivenSpec(givenUpdatedSpec),
          id: givenCreatedEntityEmbedding.id,
        });
        // AND expect only one embedding to exist for the entity, service and field
        const actualCount = await repository.Model.countDocuments({}).exec();
        expect(actualCount).toEqual(1);
      });

      test("should create one entity embedding per source field of the same entity and service", async () => {
        // GIVEN an entity embedding for the preferredLabel of an entity in the database
        const givenPreferredLabelSpec = getNewEntityEmbeddingSpec({ sourceField: EmbeddableField.preferredLabel });
        await repository.upsert(givenPreferredLabelSpec);
        // AND a spec for the description of the same entity and service
        const givenDescriptionSpec = getNewEntityEmbeddingSpec({ sourceField: EmbeddableField.description });

        // WHEN upserting the description spec
        await repository.upsert(givenDescriptionSpec);

        // THEN expect two embeddings to exist for the entity
        const actualCount = await repository.Model.countDocuments({}).exec();
        expect(actualCount).toEqual(2);
      });

      test("should reject with an error when the spec is invalid", async () => {
        // GIVEN an entity embedding spec with an empty vector
        const givenInvalidSpec = getNewEntityEmbeddingSpec({ vector: [] });

        // WHEN upserting the invalid spec
        const actualPromise = repository.upsert(givenInvalidSpec);

        // THEN expect it to reject with an error
        await expect(actualPromise).rejects.toThrow("EntityEmbeddingRepository.upsert: upsert failed");
      });

      TestDBConnectionFailureNoSetup((repositoryRegistry) => {
        return repositoryRegistry[registryKey as "skillEmbedding"].upsert(getNewEntityEmbeddingSpec());
      });
    });

    describe("Test findByEntity() entity embeddings", () => {
      test("should find all the embeddings of the given entity for the given embedding service", async () => {
        // GIVEN two embeddings of an entity for an embedding service in the database
        const givenPreferredLabelSpec = getNewEntityEmbeddingSpec({ sourceField: EmbeddableField.preferredLabel });
        const givenDescriptionSpec = getNewEntityEmbeddingSpec({ sourceField: EmbeddableField.description });
        await repository.upsert(givenPreferredLabelSpec);
        await repository.upsert(givenDescriptionSpec);
        // AND an embedding of a different entity
        await repository.upsert(getNewEntityEmbeddingSpec({ entityId: getMockStringId(99) }));
        // AND an embedding of the same entity for a different embedding service
        await repository.upsert(
          getNewEntityEmbeddingSpec({ embeddingServiceId: "00000000-0000-0000-0000-000000000000" })
        );
        // AND an embedding of the same entity in a different model
        await repository.upsert(getNewEntityEmbeddingSpec({ modelId: getMockStringId(98) }));

        // WHEN finding the embeddings of the entity for the embedding service
        const actualEntityEmbeddings = await repository.findByEntity(
          givenPreferredLabelSpec.modelId,
          givenPreferredLabelSpec.entityId,
          givenPreferredLabelSpec.embeddingServiceId
        );

        // THEN expect only the two embeddings of the given entity, model and service to be found
        expect(actualEntityEmbeddings).toHaveLength(2);
        expect(actualEntityEmbeddings).toEqual(
          expect.arrayContaining([
            expectedFromGivenSpec(givenPreferredLabelSpec),
            expectedFromGivenSpec(givenDescriptionSpec),
          ])
        );
      });

      test("should return an empty array when the entity has no embeddings", async () => {
        // GIVEN no embeddings in the database
        // WHEN finding the embeddings of an entity
        const actualEntityEmbeddings = await repository.findByEntity(
          getMockStringId(1),
          getMockStringId(2),
          "77bb8ff3-a6b0-460b-bcaa-00631a907852"
        );

        // THEN expect an empty array to be returned
        expect(actualEntityEmbeddings).toEqual([]);
      });

      TestDBConnectionFailureNoSetup((repositoryRegistry) => {
        return repositoryRegistry[registryKey as "skillEmbedding"].findByEntity(
          getMockStringId(1),
          getMockStringId(2),
          "77bb8ff3-a6b0-460b-bcaa-00631a907852"
        );
      });
    });
  }
);
