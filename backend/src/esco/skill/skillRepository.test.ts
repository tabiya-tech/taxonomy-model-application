// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { ISkillRepository } from "./skillRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { INewSkillSpec, ISkill } from "./skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import { INewOccupationSpec } from "esco/occupation/occupation.types";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { ISkillToSkillRelationPairDoc } from "esco/skillToSkillRelation/skillToSkillRelation.types";

import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import { getNewOccupationSpec, getNewSkillSpec } from "esco/_test_utilities/getNewSpecs";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected INewSkillSpec from a given INewSkillSpec,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewSkillSpec): ISkill {
  return {
    ...givenSpec,
    id: expect.any(String),
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
  };
}

describe("Test the Skill Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let dbConnection: Connection;
  let repository: ISkillRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skill;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false);
    }
  });

  test("should return the model", async () => {
    expect(repository.Model).toBeDefined();
  });

  test("initOnce has registered the SkillRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skill).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() skill", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a new skill", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with the given specifications
      const actualNewSkill = await repository.create(givenNewSkillSpec);

      // THEN expect the new skill to be created with the specific attributes
      const expectedNewSkill: ISkill = expectedFromGivenSpec(givenNewSkillSpec);
      expect(actualNewSkill).toEqual(expectedNewSkill);
    });

    test("should reject with an error when creating a skill and providing a UUID", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with the given specifications by providing a UUID
      const actualPromise = repository.create({
        ...givenNewSkillSpec,
        //@ts-ignore
        UUID: randomUUID(),
      });

      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating skill with an existing UUID", async () => {
      // GIVEN a Skill record exists in the database
      const givenNewSkillSpecSpec: INewSkillSpec = getNewSkillSpec();
      const givenNewModel = await repository.create(givenNewSkillSpecSpec);

      // WHEN Creating a new Skill with the UUID of the existing Skill
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      const actualPromise = repository.create(givenNewSkillSpecSpec);

      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/duplicate key/);
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.create(getNewSkillSpec());
    });
  });

  describe("Test createMany() Skill ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a batch of new Skills", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenNewSkillSpecs);

      // THEN expect all the Skills to be created with the specific attributes
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenNewSkillSpecs.map((givenNewSkillSpec) => {
            return expectedFromGivenSpec(givenNewSkillSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new Skills even if some don't validate", async () => {
      // GIVEN two valid skillSpecs
      const givenValidSkillSpecs: INewSkillSpec[] = [getNewSkillSpec(), getNewSkillSpec()];
      // AND two SkillSpec that is invalid
      const givenInvalidSkillSpec: INewSkillSpec[] = [getNewSkillSpec(), getNewSkillSpec()];
      givenInvalidSkillSpec[0].preferredLabel = ""; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidSkillSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany([
        givenValidSkillSpecs[0],
        ...givenInvalidSkillSpec,
        givenValidSkillSpecs[1],
      ]);

      // THEN expect only the valid Skills to be created
      expect(actualNewSkills).toHaveLength(givenValidSkillSpecs.length);
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenValidSkillSpecs.map((givenNewSkillSpec) => {
            return expectedFromGivenSpec(givenNewSkillSpec);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillSpec
      const givenBatchSize = 3;
      const givenInValidSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenInValidSkillSpecs[i] = getNewSkillSpec();
        givenInValidSkillSpecs[i].preferredLabel = "";
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenInValidSkillSpecs);

      // THEN expect no skill to be created
      expect(actualNewSkills).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 SkillSpecs
        const givenBatchSize = 3;
        const givenNewSkillSpecs: INewSkillSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillSpecs[i] = getNewSkillSpec();
        }

        // WHEN creating the batch of skills with the given specifications (the second SkillSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenNewSkillSpecs);

        // THEN expect only the first and the third Skill to be created with the specific attributes
        expect(actualNewSkills).toEqual(
          expect.arrayContaining(
            givenNewSkillSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewSkillSpec) => {
                return expectedFromGivenSpec(givenNewSkillSpec);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.createMany([getNewSkillSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find a Skill by its id", async () => {
      // GIVEN a Skill exists in the database
      const givenSkillSpecs = getNewSkillSpec();
      const givenSkill = await repository.create(givenSkillSpecs);

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById(givenSkill.id);

      // THEN expect the Skill to be found
      expect(actualFoundSkill).toEqual(givenSkill);
    });

    test("should return null if no Skill with the given id exists", async () => {
      // GIVEN no Skill exists in the database

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no Skill to be found
      expect(actualFoundSkill).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no Skill exists in the database

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById("non_existing_id");

      // THEN expect no Skill to be found
      expect(actualFoundSkill).toBeNull();
    });

    describe("Test Skill hierarchy robustness to inconsistencies", () => {
      test("should ignore children that are not Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-Skill document is the child of a skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);

        // The non-Skill in this case an Occupation
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkill.id),
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          //@ts-ignore
          childType: ObjectTypes.Occupation, // <- This is the inconsistency
          childDocModel: MongooseModelName.Occupation, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenOccupation.id), // <- This is the inconsistency
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent parent
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Parent/Child is not a Skill or SkillGroup: ${givenInconsistentPair.childDocModel}`
        );
      });

      test("should ignore parents that are not Skills | SkillGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-Skill or SkillGroup document is a parent of a skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        //  The non-Skill in this case an Occupation
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),
          //@ts-ignore
          parentType: ObjectTypes.Occupation, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Occupation, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenOccupation.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenSkill.id),
          childDocModel: MongooseModelName.Skill,
          childType: ObjectTypes.Skill,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent parent
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.parents).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Parent/Child is not a Skill or SkillGroup: ${givenInconsistentPair.parentDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in a different model than the hierarchy
        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenModelId_3 = getMockId(3);

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenSkill_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          childId: new mongoose.Types.ObjectId(givenSkill_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Skill,
          childType: ObjectTypes.Skill,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for skill_1 by its id
        const actualFoundSkill_1 = await repository.findById(givenSkill_1.id);

        // THEN expect the Skill to not contain the inconsistent children
        expect(actualFoundSkill_1).not.toBeNull();
        expect(actualFoundSkill_1!.children).toEqual([]);
        expect(actualFoundSkill_1!.parents).toEqual([]);

        // WHEN searching for the skill_2 by its id
        const actualFoundGroup_2 = await repository.findById(givenSkill_2.id);

        // THEN expect the Skill to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parents).toEqual([]);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the child is in a different model
        givenSkillSpecs_2.modelId = getMockId(99); // <-- this is the inconsistency
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        //@ts-ignore
        const inconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill_1.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkill_1.id),
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          childId: new mongoose.Types.ObjectId(givenSkill_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Skill,
          childType: ObjectTypes.Skill,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the skill_1 by its id
        jest.spyOn(console, "error");
        const givenFoundSkill_1 = await repository.findById(givenSkill_1.id);

        // THEN expect the skill to not contain the inconsistent children
        expect(givenFoundSkill_1).not.toBeNull();
        expect(givenFoundSkill_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the parent is in a different model
        givenSkillSpecs_2.modelId = getMockId(99); // <-- this is the inconsistency
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        //@ts-ignore
        const inconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill_1.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkill_2.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          childId: new mongoose.Types.ObjectId(givenSkill_1.id),
          childDocModel: MongooseModelName.Skill,
          childType: ObjectTypes.Skill,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_2 by its id
        jest.spyOn(console, "error");
        const actualFoundSkill_2 = await repository.findById(givenSkill_1.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundSkill_2).not.toBeNull();
        expect(actualFoundSkill_2!.parents).toEqual([]); // <-- The inconsistent parent is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });
    });

    describe("Test Skill-Skill relations robustness to inconsistencies", () => {
      test("should ignore requiredSkills that are not Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-Skill document has a requireSkill relation with a skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);

        // The non-Skill in this case an Occupation
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiringSkillDocModel: MongooseModelName.Skill,

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenOccupation.id), // <- This is the inconsistency
          requiredSkillDocModel: MongooseModelName.Occupation, // <- This is the inconsistency

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiredSkill
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiresSkills).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Required/RequiredBy is not a Skill: ${givenInconsistentPair.requiredSkillDocModel}`
        );
      });

      test("should ignore requiringSkills that are not Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-Skill document has a requiringSkill relation with a skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);

        // The non-Skill in this case an Occupation
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenOccupation = await repositoryRegistry.occupation.create(givenNewOccupationSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenOccupation.id), // <- This is the inconsistency
          requiringSkillDocModel: MongooseModelName.Occupation, // <- This is the inconsistency

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiringSkill
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiresSkills).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Required/RequiredBy is not a Skill: ${givenInconsistentPair.requiringSkillDocModel}`
        );
      });

      test("should not find requiringSkill or requiredSkill if the relation is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the requiring and requiredSkills are in a different model than the relation
        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockId(3);

        //@ts-ignore
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenSkill_1.id), // <- This is the inconsistency
          requiringSkillDocModel: MongooseModelName.Skill, // <- This is the inconsistency

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenSkill_2.id),
          requiredSkillDocModel: MongooseModelName.Skill,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for skill_1 by its id
        const actualFoundSkill_1 = await repository.findById(givenSkill_1.id);

        // THEN expect the Skill to not contain the inconsistent children
        expect(actualFoundSkill_1).not.toBeNull();
        expect(actualFoundSkill_1!.requiresSkills).toEqual([]);
        expect(actualFoundSkill_1!.requiredBySkills).toEqual([]);

        // WHEN searching for the skill_2 by its id
        const actualFoundGroup_2 = await repository.findById(givenSkill_2.id);

        // THEN expect the Skill to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.requiresSkills).toEqual([]);
        expect(actualFoundGroup_2!.requiredBySkills).toEqual([]);
      });

      test("should not find requiringSkill if it is not is the same model as the requiredSkill", async () => {
        // GIVEN an inconsistency was introduced, and the requiredSkill and the requiringSkill are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the requiredSkill is in a different model
        givenSkillSpecs_2.modelId = getMockId(99); // <-- this is the inconsistency
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        //@ts-ignore
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill_1.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenSkill_1.id),
          requiringSkillDocModel: MongooseModelName.Skill,

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenSkill_2.id), // <- This is the inconsistency
          requiredSkillDocModel: MongooseModelName.Skill,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill_1 by its id
        jest.spyOn(console, "error");
        const givenFoundSkill_1 = await repository.findById(givenSkill_1.id);

        // THEN expect the skill to not contain the inconsistent requiredSkills
        expect(givenFoundSkill_1).not.toBeNull();
        expect(givenFoundSkill_1!.requiredBySkills).toEqual([]); // <-- The inconsistent requiredSkill is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Required skill is not in the same model as the Requiring skill`);
      });

      test("should not find requiredSkill if it is not is the same model as the requiringSkill", async () => {
        // GIVEN an inconsistency was introduced, and the requiredSkill and the requiringSkill are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the requiredSkill is in a different model
        givenSkillSpecs_2.modelId = getMockId(99); // <-- this is the inconsistency
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        //@ts-ignore
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill_1.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenSkill_2.id), // <- This is the inconsistency
          requiringSkillDocModel: MongooseModelName.Skill,

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenSkill_1.id),
          requiredSkillDocModel: MongooseModelName.Skill,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill_2 by its id
        jest.spyOn(console, "error");
        const givenFoundSkill_2 = await repository.findById(givenSkill_1.id);

        // THEN expect the skill to not contain the inconsistent requiredSkills
        expect(givenFoundSkill_2).not.toBeNull();
        expect(givenFoundSkill_2!.requiresSkills).toEqual([]); // <-- The inconsistent requiredSkill is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Requiring skill is not in the same model as the Required skill`);
      });
    });

    test.todo("should return the skill with its parent and children");

    test.todo("should return the skill with its related skills");

    test.todo("should return the skill with its related occupations");

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.findById(getMockId(1));
    });
  });
});
