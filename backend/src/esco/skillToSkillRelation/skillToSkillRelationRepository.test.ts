// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";

import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillToSkillRelationRepository } from "./skillToSkillRelationRepository";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  SkillToSkillRelationType,
} from "./skillToSkillRelation.types";
import { getSimpleNewISCOGroupSpec, getSimpleNewSkillSpec } from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailure,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedRelatedSkillReference } from "esco/_test_utilities/expectedReference";
import * as HandleInsertManyErrors from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";

describe("Test the SkillToSkillRelation Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: ISkillToSkillRelationRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillToSkillRelationRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillToSkillRelation;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  afterEach(async () => {
    await cleanupDBCollections();
  });

  async function cleanupDBCollections() {
    if (repository) await repository.relationModel.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
    }
  }

  /** Helper function to create n simple SkillToSkillRelation in the db,
   * @param modelId
   * @param batchSize
   */
  async function createSkillToSkillRelationsInDB(modelId: string, batchSize: number = 3) {
    const givenNewSkillToSkillPairSpecs: INewSkillToSkillPairSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(modelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(modelId, "skill_2"));
      givenNewSkillToSkillPairSpecs.push({
        requiringSkillId: givenSkill_1.id,
        relationType: SkillToSkillRelationType.OPTIONAL,
        requiredSkillId: givenSkill_2.id,
      });
    }
    return await repository.createMany(modelId, givenNewSkillToSkillPairSpecs);
  }

  test("should return the model", async () => {
    expect(repository.relationModel).toBeDefined();
  });

  test("initOnce has registered the SkillToSkillRelationRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().skillToSkillRelation).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test createMany()", () => {
    afterEach(async () => {
      for (const collection of Object.values(dbConnection.collections)) {
        await collection.deleteMany({});
      }
    });

    beforeEach(async () => {
      for (const collection of Object.values(dbConnection.collections)) {
        await collection.deleteMany({});
      }
    });

    test("should successfully create the Skills to Skills relationship", async () => {
      // GIVEN 4 Skills exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));
      const givenSkill_3 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_3"));
      const givenSkill_4 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_4"));

      // AND the following relation
      const givenNewRelationSpecs = [
        {
          requiringSkillId: givenSkill_1.id,
          relationType: SkillToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_2.id,
        },
        {
          requiringSkillId: givenSkill_3.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_4.id,
        },
      ];

      // WHEN updating the relation of the Skills
      const actualNewSkillToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect all the Relation entries to be created
      expect(actualNewSkillToSkillRelation).toHaveLength(givenNewRelationSpecs.length);

      // AND to have the expected relation
      for (const spec of givenNewRelationSpecs) {
        const actualRequiringSkill = await repositoryRegistry.skill.findById(spec.requiringSkillId);
        const actualRequiredSkill = await repositoryRegistry.skill.findById(spec.requiredSkillId);

        const requiredSkill = [givenSkill_2, givenSkill_4].find((skill) => skill.id === spec.requiredSkillId);
        const requiringSkill = [givenSkill_1, givenSkill_3].find((skill) => skill.id === spec.requiringSkillId);
        if (!requiringSkill || !requiredSkill) throw new Error("Cant find skill");
        const expectedRequiredSkillReference = expectedRelatedSkillReference(requiredSkill, spec.relationType);
        const expectedRequiringSkillReference = expectedRelatedSkillReference(requiringSkill, spec.relationType);

        expect(actualRequiringSkill?.requiresSkills).toContainEqual(expectedRequiredSkillReference);
        expect(actualRequiredSkill?.requiredBySkills).toContainEqual(expectedRequiringSkillReference);
      }
    });

    test("should successfully update the relation even if some don't validate", async () => {
      // GIVEN 4 Skills exist in the database
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));
      const givenSkill_3 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_3"));
      const givenSkill_4 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_4"));
      // AND the following relation

      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: givenSkill_1.id,
          relationType: SkillToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_2.id,
        },
        {
          requiringSkillId: givenSkill_3.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_4.id,
        },
        {
          // @ts-ignore
          additionalField: "foo", // <------ Invalid additional field
          requiringSkillId: givenSkill_2.id,
          relationType: SkillToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_3.id,
        },
        {
          //<----- missing field
          relationType: SkillToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_2.id,
        } as INewSkillToSkillPairSpec,
      ];

      // WHEN updating the relation of the Skills
      // AND the third and fourth relation entries do not validate
      const actualNewSkillToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      expect(actualNewSkillToSkillRelation).toHaveLength(2);
      expect(actualNewSkillToSkillRelation).toEqual(
        expect.arrayContaining(
          [givenNewRelationSpecs[0], givenNewRelationSpecs[1]].map<ISkillToSkillRelationPair>(
            (newSpec: INewSkillToSkillPairSpec) => {
              return {
                ...newSpec,
                requiringSkillDocModel: MongooseModelName.Skill,
                requiredSkillDocModel: MongooseModelName.Skill,
                id: expect.any(String),
                modelId: givenModelId,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              };
            }
          )
        )
      );
    });

    test("should ignore duplicate entries and only import the first one", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));

      const handleInsertManyErrorSpy = jest.spyOn(HandleInsertManyErrors, "handleInsertManyError");
      // AND the following specs
      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: givenSkill_1.id,
          requiredSkillId: givenSkill_2.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
        {
          requiringSkillId: givenSkill_1.id,
          requiredSkillId: givenSkill_2.id, // <---- duplicate
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ];

      // WHEN creating new relations
      const actualNewSkillToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect only one new entry to be created, as the second one is a duplicate
      expect(actualNewSkillToSkillRelations).toHaveLength(1);
      // AND expect the error handler function to have been called
      expect(handleInsertManyErrorSpy).toHaveBeenCalled();
      // AND expect the created entry to be valid
      expect(actualNewSkillToSkillRelations[0]).toEqual({
        ...givenNewRelationSpecs[0],
        id: expect.any(String),
        modelId: givenModelId,
        requiringSkillDocModel: MongooseModelName.Skill,
        requiredSkillDocModel: MongooseModelName.Skill,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      // cleanup the mock
      handleInsertManyErrorSpy.mockRestore();
    });

    test("should throw an error if the modelId is invalid", async () => {
      // GIVEN an invalid modelId
      const givenModelId = "not-a-valid-id";

      // WHEN creating a new relation with an invalid modelId
      const actualRelationPromise = repository.createMany(givenModelId, []);

      // Then expect the promise to reject with an error
      await expect(actualRelationPromise).rejects.toThrowError(`Invalid modelId: ${givenModelId}`);
    });

    test("should ignore entries that refer to not existing objects", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: getMockStringId(998), // Non-existent skill id
          requiredSkillId: givenSkill_1.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
        {
          requiringSkillId: givenSkill_1.id,
          requiredSkillId: getMockStringId(999), // Non-existent skill id
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ];

      // WHEN creating a new relation with entries referring to non-existing objects
      const actualNewSkillToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries that refer to objects that are not in the same model", async () => {
      // GIVEN two different modelIds
      const givenModelId_1 = getMockStringId(1);
      const givenModelId_2 = getMockStringId(2);
      const givenSkill_1_in_Model_1 = await repositoryRegistry.skill.create(
        getSimpleNewSkillSpec(givenModelId_1, "skill_1")
      );
      const givenSkill_2_in_Model_2 = await repositoryRegistry.skill.create(
        getSimpleNewSkillSpec(givenModelId_2, "skill_2")
      );

      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: givenSkill_1_in_Model_1.id,
          requiredSkillId: givenSkill_2_in_Model_2.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ];

      // WHEN creating a new relation with skills from different models
      const actualNewSkillToSkillRelations = await repository.createMany(givenModelId_1, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries where both the requiring and required Skills are the same", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: givenSkill_1.id,
          requiredSkillId: givenSkill_1.id, // Self relation
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ];

      // WHEN creating a new relation where a skill requires itself
      const actualNewSkillToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries where both the requiring and required are not skills", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenInvalidObject_1 = await repositoryRegistry.OccupationGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      ); // Assuming there's an OccupationGroup model

      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [
        {
          requiringSkillId: givenInvalidObject_1.id,
          requiredSkillId: givenSkill_1.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
        {
          requiringSkillId: givenSkill_1.id,
          requiredSkillId: givenInvalidObject_1.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ];

      // WHEN creating a new relation with invalid parent or child objects
      const actualNewSkillToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillToSkillRelations).toHaveLength(0);
    });

    type SetupResult = {
      givenModelId: string;
      givenNewRelationSpecs: INewSkillToSkillPairSpec[];
    };

    TestDBConnectionFailure<SetupResult, unknown>(
      async (repositoryRegistry) => {
        // GIVEN 4 Skills exist in the database in the same model
        const givenModelId = getMockStringId(1);
        const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
        const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));
        const givenSkill_3 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_3"));
        const givenSkill_4 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_4"));

        // AND the following relation
        const givenNewRelationSpecs = [
          {
            requiringSkillId: givenSkill_1.id,
            relationType: SkillToSkillRelationType.OPTIONAL,
            requiredSkillId: givenSkill_2.id,
          },
          {
            requiringSkillId: givenSkill_3.id,
            relationType: SkillToSkillRelationType.ESSENTIAL,
            requiredSkillId: givenSkill_4.id,
          },
        ];
        return { givenModelId, givenNewRelationSpecs };
      },
      async (setupResult, repositoryRegistry) => {
        await repositoryRegistry.skillToSkillRelation.createMany(
          setupResult.givenModelId,
          setupResult.givenNewRelationSpecs
        );
      }
    );
  });

  describe("Test findAll()", () => {
    test("should find all skillToSkills relations in the given model", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of skillToSkill relations exist in the database
      const givenNewSkillToSkillRelations = await createSkillToSkillRelationsInDB(givenModelId);
      // AND some others exist for a different model
      await createSkillToSkillRelationsInDB(getMockStringId(2));

      // WHEN finding all skillToSkill relations for the given modelId
      const actualSkillToSkillRelations = repository.findAll(givenModelId);

      // THEN expect all the skillToSkill relations to be returned as a consumable stream
      const actualSkillToSkillRelationsArray: ISkillToSkillRelationPair[] = [];
      for await (const data of actualSkillToSkillRelations) {
        actualSkillToSkillRelationsArray.push(data);
      }
      expect(actualSkillToSkillRelationsArray).toEqual(givenNewSkillToSkillRelations);
    });

    test("should not return any entry when the given model does not have any skillToSkill relations but other models does", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND some skillToSkill relations exist in the database for a different model
      await createSkillToSkillRelationsInDB(getMockStringId(2));

      // WHEN finding all skillToSkill relations for the given modelId
      const actualSkillToSkillRelations = repository.findAll(givenModelId);

      // THEN expect no skillToSkill relations to be returned
      const actualSkillToSkillRelationsArray: ISkillToSkillRelationPair[] = [];
      for await (const data of actualSkillToSkillRelations) {
        actualSkillToSkillRelationsArray.push(data);
      }
      expect(actualSkillToSkillRelationsArray).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN that an error will occur when retrieving data
      const givenError = new Error("foo");
      jest.spyOn(repository.relationModel, "find").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN finding all skillToSkill relations for some modelId
      const actualSkillToSkillRelations = () => repository.findAll(getMockStringId(1));

      // THEN expect the operation to fail with the given error
      expect(actualSkillToSkillRelations).toThrow(
        expect.toMatchErrorWithCause("SkillToSkillRelationRepository.findAll: findAll failed", givenError.message)
      );
    });

    test("should end and emit an error if an error occurs during data retrieval in the upstream", async () => {
      // GIVEN that an error will occur during the streaming of data
      const givenError = new Error("foo");
      const mockStream = Readable.from([{ toObject: jest.fn() }]);
      mockStream._read = jest.fn().mockImplementation(() => {
        throw givenError;
      });
      const mockFind = jest.spyOn(repository.relationModel, "find");
      // @ts-ignore
      mockFind.mockReturnValue({
        cursor: jest.fn().mockReturnValueOnce(mockStream),
      });

      // WHEN finding all skillToSkill relations for some modelId
      const actualStream = repository.findAll(getMockStringId(1));

      // THEN expect the operation to return a stream that emits an error
      const actualSkillToSkillRelationsArray: ISkillToSkillRelationPair[] = [];
      await expect(async () => {
        for await (const data of actualStream) {
          actualSkillToSkillRelationsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("SkillToSkillRelationRepository.findAll: stream failed", givenError.message)
      );
      expect(actualStream.closed).toBeTruthy();
      expect(actualSkillToSkillRelationsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.skillToSkillRelation.findAll(getMockStringId(1))
    );
  });
});
