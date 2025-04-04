// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";

import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewLocalOccupationSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailure,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import {
  expectedRelatedOccupationReference,
  expectedRelatedSkillReference,
} from "esco/_test_utilities/expectedReference";
import { IOccupationToSkillRelationRepository } from "./occupationToSkillRelationRepository";
import {
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
  OccupationToSkillRelationType,
} from "./occupationToSkillRelation.types";
import * as HandleInsertManyErrors from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";

describe("Test the OccupationToSkillRelation Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: IOccupationToSkillRelationRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationToSkillRelationRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.occupationToSkillRelation;
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
      await repositoryRegistry.occupation.Model.deleteMany({}).exec();
    }
  }

  /** Helper function to create n simple OccupationToSkillRelation in the db,
   * @param modelId
   * @param batchSize
   */
  async function createOccupationToSkillRelationsInDB(modelId: string, batchSize: number = 3) {
    const newOccupationToSkillPairSpecs: INewOccupationToSkillPairSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      const occupation = await repositoryRegistry.occupation.create(getSimpleNewESCOOccupationSpec(modelId, "skill_1"));
      const skill = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(modelId, "skill_2"));
      newOccupationToSkillPairSpecs.push({
        requiringOccupationId: occupation.id,
        relationType: OccupationToSkillRelationType.OPTIONAL,
        requiredSkillId: skill.id,
        requiringOccupationType: ObjectTypes.ESCOOccupation,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      });
    }
    return await repository.createMany(modelId, newOccupationToSkillPairSpecs);
  }

  test("should return the model", async () => {
    expect(repository.relationModel).toBeDefined();
  });

  test("initOnce has registered the OccupationToSkillRelationRepository", async () => {
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

    test("should successfully create the Occupation to Skills relationship", async () => {
      // GIVEN 2 Occupations and 2 Skillls exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenOccupation_2 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_2")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));

      // AND the following relation
      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: givenOccupation_2.id,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_2.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN updating the relation
      const actualNewOccupationToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect all the Relation entries to be created
      expect(actualNewOccupationToSkillRelation).toHaveLength(givenNewRelationSpecs.length);

      // AND to have the expected relation
      for (const spec of givenNewRelationSpecs) {
        const actualOccupation = await repositoryRegistry.occupation.findById(spec.requiringOccupationId);
        const actualSkill = await repositoryRegistry.skill.findById(spec.requiredSkillId);

        const occupation = [givenOccupation_1, givenOccupation_2].find(
          (occupation) => occupation.id === spec.requiringOccupationId
        );
        const skill = [givenSkill_1, givenSkill_2].find((skill) => skill.id === spec.requiredSkillId);
        if (!occupation || !skill) throw new Error("Cant find skill");
        const expectedActualOccupationReference = expectedRelatedOccupationReference(occupation, spec.relationType);
        const expectedActualSkillReference = expectedRelatedSkillReference(skill, spec.relationType);

        expect(actualOccupation?.requiresSkills).toContainEqual(expectedActualSkillReference);
        expect(actualSkill?.requiredByOccupations).toContainEqual(expectedActualOccupationReference);
      }
    });

    test("should successfully create the relation for different occupation types", async () => {
      // GIVEN Occupations that are of different types exist in the same model
      const givenModelId = getMockStringId(2);
      const escoOccupationSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "ESCO Occupation");
      const escoOccupation = await repositoryRegistry.occupation.create(escoOccupationSpecs);
      const localOccupation1Specs = getSimpleNewLocalOccupationSpec(givenModelId, "Local Occupation 1");
      const localOccupation1 = await repositoryRegistry.occupation.create(localOccupation1Specs);
      const localOccupation2Specs = getSimpleNewLocalOccupationSpec(givenModelId, "Local Occupation 2");
      const localOccupation2 = await repositoryRegistry.occupation.create(localOccupation2Specs);

      // AND a skill in the same model which is a child of each of the occupations
      const childSkillSpecs = getSimpleNewSkillSpec(givenModelId, "childSkill");
      const childSkill = await repositoryRegistry.skill.create(childSkillSpecs);

      // AND the following relation
      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: escoOccupation.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: childSkill.id,
          requiringOccupationType: escoOccupation.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: localOccupation1.id,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: childSkill.id,
          requiringOccupationType: localOccupation1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: localOccupation2.id,
          relationType: OccupationToSkillRelationType.NONE,
          signallingValueLabel: SignallingValueLabel.HIGH,
          signallingValue: Math.random(),
          requiredSkillId: childSkill.id,
          requiringOccupationType: localOccupation2.occupationType,
        },
      ];

      // WHEN updating the relation
      const actualNewOccupationToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect all the Relation entries to be created
      expect(actualNewOccupationToSkillRelation).toHaveLength(givenNewRelationSpecs.length);
    });

    test("should successfully create the relation for different occupation types even if an occupation shares the same ids as a skill", async () => {
      // GIVEN An occupations exist in a same model
      const givenModelId = getMockStringId(1);
      const givenObjectId = getMockStringId(2);
      const escoOccupationSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "ESCO Occupation");
      //@ts-ignore
      escoOccupationSpecs.id = givenObjectId;
      const escoOccupation = await repositoryRegistry.occupation.create(escoOccupationSpecs);
      // AND a skill in the same model and with the same id as the occupation
      const childSkillSpecs = getSimpleNewSkillSpec(givenModelId, "childSkill");
      //@ts-ignore
      childSkillSpecs.id = givenObjectId;
      const childSkill = await repositoryRegistry.skill.create(childSkillSpecs);
      // guard to make sure the ids are the same
      expect(escoOccupation.id).toEqual(childSkill.id);

      // AND the following relation
      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: escoOccupation.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: childSkill.id,
          requiringOccupationType: escoOccupation.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating the relation
      const actualNewOccupationToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect all the Relation entries to be created
      expect(actualNewOccupationToSkillRelation).toHaveLength(givenNewRelationSpecs.length);
    });

    test("should successfully update the relation even if some don't validate", async () => {
      // GIVEN 2 Occupations and 2 Skillls exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenOccupation_2 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_2")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));
      // AND the following relation

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: givenOccupation_2.id,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_2.id,
          requiringOccupationType: givenOccupation_2.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          //@ts-ignore
          additionalField: "foo", //<------- invalid additional field
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
        },
        {
          //<----- missing field
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_2.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
        } as INewOccupationToSkillPairSpec,
      ];

      // WHEN updating the relation of the Skills
      // AND the third and fourth relation entries do not validate
      const actualNewOccupationToSkillRelation = await repository.createMany(givenModelId, givenNewRelationSpecs);

      expect(actualNewOccupationToSkillRelation).toHaveLength(2);
      expect(actualNewOccupationToSkillRelation).toEqual(
        expect.arrayContaining(
          [givenNewRelationSpecs[0], givenNewRelationSpecs[1]].map<IOccupationToSkillRelationPair>(
            (newSpec: INewOccupationToSkillPairSpec) => {
              console.log({ actualNewOccupationToSkillRelation });
              return {
                ...newSpec,
                requiringOccupationDocModel: MongooseModelName.Occupation,
                requiredSkillDocModel: MongooseModelName.Skill,
                signallingValue: null,
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
      // AND an occupation and a skill exist in the db
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      const handleInsertManyErrorSpy = jest.spyOn(HandleInsertManyErrors, "handleInsertManyError");

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: givenOccupation_1.id, //<----- duplicate entry
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating new relations
      const actualNewOccupationToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect only one new entry to be created, as the second one is a duplicate
      expect(actualNewOccupationToSkillRelations).toHaveLength(1);
      // AND expect the error handler function to have been called
      expect(handleInsertManyErrorSpy).toHaveBeenCalled();
      // AND expect the created entry to be valid
      expect(actualNewOccupationToSkillRelations[0]).toEqual({
        ...givenNewRelationSpecs[0],
        id: expect.any(String),
        modelId: givenModelId,
        requiringOccupationDocModel: MongooseModelName.Occupation,
        requiredSkillDocModel: MongooseModelName.Skill,
        signallingValue: null,
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
      const givenModelId = getMockStringId(1);
      // AND an occupation and a skill exist in the db
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: getMockStringId(998), //Non existent requiringOccupationId
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          requiredSkillId: getMockStringId(999), //Non existent requiredSkillId
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating a new relation with entries referring to non-existing objects
      const actualNewOccupationToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries that refer to objects that are not in the same model", async () => {
      // GIVEN two different modelIds
      const givenModelId_1 = getMockStringId(1);
      const givenModelId_2 = getMockStringId(2);
      // AND an occupation and a skill that are in different models
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId_1, "occupation_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId_2, "skill_1"));

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating a new relation with skills from different models
      const actualNewOccupationToSkillRelations = await repository.createMany(givenModelId_1, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries where the requiring occupation is not an occupation", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenInvalidObject_1 = await repositoryRegistry.OccupationGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      ); // Assuming there's an OccupationGroup model

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenInvalidObject_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenSkill_1.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating a new relation with invalid parent or child objects
      const actualNewOccupationToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationToSkillRelations).toHaveLength(0);
    });

    test("should ignore entries where the required Skill is not a skill", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenInvalidObject_1 = await repositoryRegistry.OccupationGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      ); // Assuming there's an OccupationGroup model

      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
        {
          requiringOccupationId: givenOccupation_1.id,
          relationType: OccupationToSkillRelationType.OPTIONAL,
          requiredSkillId: givenInvalidObject_1.id,
          requiringOccupationType: givenOccupation_1.occupationType,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ];

      // WHEN creating a new relation with invalid parent or child objects
      const actualNewOccupationToSkillRelations = await repository.createMany(givenModelId, givenNewRelationSpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationToSkillRelations).toHaveLength(0);
    });
    type SetupResult = {
      givenModelId: string;
      givenNewRelationSpecs: INewOccupationToSkillPairSpec[];
    };

    TestDBConnectionFailure<SetupResult, unknown>(
      async (repositoryRegistry) => {
        // GIVEN 2 ESCO occupations and 2 Skills exist in the database in the same model
        const givenModelId = getMockStringId(1);
        const givenOccupation_1 = await repositoryRegistry.occupation.create(
          getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
        );
        const givenOccupation_2 = await repositoryRegistry.occupation.create(
          getSimpleNewESCOOccupationSpec(givenModelId, "occuoation_2")
        );
        const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
        const givenSkill_2 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_2"));

        // AND the following relation
        const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [
          {
            requiringOccupationId: givenOccupation_1.id,
            relationType: OccupationToSkillRelationType.OPTIONAL,
            requiredSkillId: givenSkill_1.id,
            requiringOccupationType: givenOccupation_1.occupationType,
            signallingValueLabel: SignallingValueLabel.NONE,
            signallingValue: null,
          },
          {
            requiringOccupationId: givenOccupation_2.id,
            relationType: OccupationToSkillRelationType.ESSENTIAL,
            requiredSkillId: givenSkill_2.id,
            requiringOccupationType: givenOccupation_2.occupationType,
            signallingValueLabel: SignallingValueLabel.NONE,
            signallingValue: null,
          },
        ];
        return { givenModelId, givenNewRelationSpecs };
      },
      async (setupResult, repositoryRegistry) => {
        await repositoryRegistry.occupationToSkillRelation.createMany(
          setupResult.givenModelId,
          setupResult.givenNewRelationSpecs
        );
      }
    );
  });

  describe("Test findAll()", () => {
    test("should find all occupationToSkills relations in the given model", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of occupationToSkill relations exist in the database
      const givenNewOccupationToSkillRelations = await createOccupationToSkillRelationsInDB(givenModelId);
      // AND some others exist for a different model
      await createOccupationToSkillRelationsInDB(getMockStringId(2));

      // WHEN finding all occupationToSkill relations for the given modelId
      const actualOccupationToSkillRelations = repository.findAll(givenModelId);

      // THEN expect all the occupationToSkill relations to be returned as a consumable stream
      const actualOccupationToSkillRelationsArray: IOccupationToSkillRelationPair[] = [];
      for await (const data of actualOccupationToSkillRelations) {
        actualOccupationToSkillRelationsArray.push(data);
      }
      expect(actualOccupationToSkillRelationsArray).toEqual(givenNewOccupationToSkillRelations);
    });

    test("should not return any entry when the given model does not have any occupationToSkill relations but other models does", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND some occupationToSkill relations exist in the database for a different model
      await createOccupationToSkillRelationsInDB(getMockStringId(2));

      // WHEN finding all occupationToSkill relations for the given modelId
      const actualOccupationToSkillRelations = repository.findAll(givenModelId);

      // THEN expect no occupationToSkill relations to be returned
      const actualOccupationToSkillRelationsArray: IOccupationToSkillRelationPair[] = [];
      for await (const data of actualOccupationToSkillRelations) {
        actualOccupationToSkillRelationsArray.push(data);
      }
      expect(actualOccupationToSkillRelationsArray).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN that an error will occur when retrieving data
      const givenError = new Error("foo");
      jest.spyOn(repository.relationModel, "find").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN finding all occupationToSkill relations for some modelId
      const actualOccupationToSkillRelations = () => repository.findAll(getMockStringId(1));

      // THEN expect the operation to fail with the given error
      expect(actualOccupationToSkillRelations).toThrow(
        expect.toMatchErrorWithCause("OccupationToSkillRelationRepository.findAll: findAll failed", givenError.message)
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

      // WHEN finding all occupationToSkill relations for some modelId
      const actualStream = repository.findAll(getMockStringId(1));

      // THEN expect the operation to return a stream that emits an error
      const actualOccupationToSkillRelations: IOccupationToSkillRelationPair[] = [];
      await expect(async () => {
        for await (const data of actualStream) {
          actualOccupationToSkillRelations.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("OccupationToSkillRelationRepository.findAll: stream failed", givenError.message)
      );
      expect(actualStream.closed).toBeTruthy();
      expect(actualOccupationToSkillRelations).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.occupationToSkillRelation.findAll(getMockStringId(1))
    );
  });
});
