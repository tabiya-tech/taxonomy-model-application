// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { ISkillRepository } from "./skillRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { INewSkillSpec, ISkill, ISkillDoc, ISkillReference } from "./skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, OccupationType, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import { INewOccupationSpec } from "esco/occupation/occupation.types";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { ISkillToSkillRelationPairDoc } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import {
  getNewISCOGroupSpec,
  getNewOccupationSpec,
  getNewSkillSpec,
  getSimpleNewOccupationSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  expectedRelatedOccupationReference,
  expectedRelatedSkillReference,
  expectedSkillGroupReference,
  expectedSkillReference,
} from "esco/_test_utilities/expectedReference";
import { ISkillGroupReference } from "esco/skillGroup/skillGroup.types";
import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { Readable } from "node:stream";
import { getExpectedPlan, setUpPopulateWithExplain } from "esco/_test_utilities/populateWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENTS } from "esco/skillHierarchy/skillHierarchyModel";
import {
  INDEX_FOR_REQUIRED_BY_SKILLS,
  INDEX_FOR_REQUIRES_SKILLS,
} from "esco/skillToSkillRelation/skillToSkillRelationModel";
import { INDEX_FOR_REQUIRED_BY_OCCUPATIONS } from "../occupationToSkillRelation/occupationToSkillRelationModel";

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
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewSkillSpec, newUUID: string): ISkill {
  return {
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
  };
}

describe("Test the Skill Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
  });

  afterEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
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

  /** Helper function to create n simple Skills in the db,
   * @param modelId
   * @param batchSize
   */
  async function createSkillsInDB(modelId: string, batchSize: number = 3) {
    const givenNewSkillSpecs: INewSkillSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewSkillSpecs.push(getSimpleNewSkillSpec(modelId, `skill_${i}`));
    }
    return await repository.createMany(givenNewSkillSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.skillHierarchy.hierarchyModel.deleteMany({}).exec();
      await repositoryRegistry.occupation.Model.deleteMany({}).exec();
      await repositoryRegistry.skillGroup.Model.deleteMany({}).exec();
    }
  }

  afterEach(async () => {
    await cleanupDBCollections();
  });

  beforeEach(async () => {
    await cleanupDBCollections();
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
    test("should successfully create a new skill", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with the given specifications
      const actualNewSkill = await repository.create(givenNewSkillSpec);

      // THEN expect the new skill to be created with the specific attributes
      const expectedNewSkill: ISkill = expectedFromGivenSpec(givenNewSkillSpec, actualNewSkill.UUID);
      expect(actualNewSkill).toEqual(expectedNewSkill);
    });

    test("should successfully create a new skill when the given specifications have an empty UUIDHistory", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();
      givenNewSkillSpec.UUIDHistory = [];

      // WHEN Creating a new skill with the given specifications
      const actualNewSkill = await repository.create(givenNewSkillSpec);

      // THEN expect the new skill to be created with the specific attributes
      const expectedNewSkill: ISkill = expectedFromGivenSpec(givenNewSkillSpec, actualNewSkill.UUID);
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
      (randomUUID as jest.Mock).mockReturnValueOnce(givenNewModel.UUID);
      const actualPromise = repository.create(givenNewSkillSpecSpec);

      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/duplicate key/);
    });
    //TODO: add more unique index tests i.e should should successfully create a second Identical skill in a different model (see occupationRepository_

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.create(getNewSkillSpec());
    });
  });

  describe("Test createMany() Skill ", () => {
    test("should successfully create a batch of new Skills", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: ISkill[] = await repository.createMany(givenNewSkillSpecs);

      // THEN expect all the Skills to be created with the specific attributes
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenNewSkillSpecs.map((givenNewSkillSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillSpec, actualNewSkills[index].UUID);
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
      const actualNewSkills: ISkill[] = await repository.createMany([
        givenValidSkillSpecs[0],
        ...givenInvalidSkillSpec,
        givenValidSkillSpecs[1],
      ]);

      // THEN expect only the valid Skills to be created
      expect(actualNewSkills).toHaveLength(givenValidSkillSpecs.length);
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenValidSkillSpecs.map((givenNewSkillSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillSpec, actualNewSkills[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new skills when they have an empty UUIDHistory", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
        givenNewSkillSpecs[i].UUIDHistory = [];
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: ISkill[] = await repository.createMany(givenNewSkillSpecs);

      // THEN expect all the Skills to be created with the specific attributes
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenNewSkillSpecs.map((givenNewSkillSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillSpec, actualNewSkills[index].UUID);
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
        const actualNewSkills: ISkill[] = await repository.createMany(givenNewSkillSpecs);

        // THEN expect only the first and the third Skill to be created with the specific attributes
        expect(actualNewSkills).toEqual(
          expect.arrayContaining(
            givenNewSkillSpecs
              .filter((_spec, index) => index !== 1)
              .map((givenNewSkillSpec, index) => {
                return expectedFromGivenSpec(givenNewSkillSpec, actualNewSkills[index].UUID);
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

    test("should return the Skill with its parents(SkillGroup, Skill) and children(Skills)", async () => {
      // GIVEN four Skills and one SkillGroup exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (Skill)
      const givenSubjectSpecs = getSimpleNewSkillSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (SkillGroup)
      const givenParentSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "parent_1");
      const givenParent_1 = await repositoryRegistry.skillGroup.create(givenParentSpecs_1);

      // The parent (Skill)
      const givenParentSpecs_2 = getSimpleNewSkillSpec(givenModelId, "parent_2");
      const givenParent_2 = await repository.create(givenParentSpecs_2);

      // The child Skill
      const givenChildSpecs_1 = getSimpleNewSkillSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Skill
      const givenChildSpecs_2 = getSimpleNewSkillSpec(givenModelId, "child_2");
      const givenChild_2 = await repository.create(givenChildSpecs_2);

      // AND the subject Skill has a parent and two children
      const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          // parent 1 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent_1.id,
          childType: ObjectTypes.Skill,
          childId: givenSubject.id,
        },
        {
          // parent 2 of the subject
          parentType: ObjectTypes.Skill,
          parentId: givenParent_2.id,
          childType: ObjectTypes.Skill,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.Skill,
          parentId: givenSubject.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.Skill,
          parentId: givenSubject.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(4);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ISkillDoc>(repository.Model);
      const actualFoundSkill = (await repository.findById(givenSubject.id)) as ISkill;

      // THEN expect the ISkill to be found
      expect(actualFoundSkill).not.toBeNull();

      // AND to have the given parents
      expect(actualFoundSkill.parents).toEqual(
        expect.arrayContaining<ISkillGroupReference | ISkillReference>([
          expectedSkillGroupReference(givenParent_1),
          expectedSkillReference(givenParent_2),
        ])
      );
      // AND to have the given children
      expect(actualFoundSkill.children).toEqual(
        expect.arrayContaining<ISkillGroupReference | ISkillReference>([
          expectedSkillReference(givenChild_1),
          expectedSkillReference(givenChild_2),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(8); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references,  1 for the requiresSkills, 1 for requiredBySkills and 1 for the requiredByOccupations
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.Skill },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENTS,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.Skill },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );
      // AND expect no error to be logged
      expect(console.error).toBeCalledTimes(0);
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
        expect(console.error).toBeCalledWith(new Error(`Child is not a Skill: ${givenInconsistentPair.childDocModel}`));
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
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Parent is not a Skill or SkillGroup: ${givenInconsistentPair.parentDocModel}`)
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in a different model than the hierarchy
        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenModelId_3 = getMockStringId(3);

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
        givenSkillSpecs_2.modelId = getMockStringId(99); // <-- this is the inconsistency
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
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Child is not in the same model as the parent`));
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the parent is in a different model
        givenSkillSpecs_2.modelId = getMockStringId(99); // <-- this is the inconsistency
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
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Parent is not in the same model as the child`));
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        Skill
        // 1,        2,        Skill,  4,       Skill
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject skill O_s with a given ID in the given model
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an SkillGroup G1 with the same ID as the subject skill in the given model
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, "SkillGroup");
        // @ts-ignore
        givenSkillGroupSpecs.id = givenID.toHexString();
        const givenSkillGroup = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs);
        // guard to ensure the id is the given one
        expect(givenSkillGroup.id).toEqual(givenID.toHexString());

        // AND a second skill O_1 with some ID  in the given model
        const givenSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);

        // AND a third skill O_2 with some ID in the given model
        const givenSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "skill_2");
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // AND the SkillGroup G1 is the parent of O_1
        // AND the subject skill  is the parent of O_2
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_1.id,
          },
          {
            // parent of the subject
            parentType: ObjectTypes.Skill,
            parentId: givenSubject.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only skill 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.children).toEqual([expectedSkillReference(givenSkill_2)]);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating parents", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        SkillGroup
        // 1,        2,        Skill,  4,       Skill
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject skill with a given ID in the given model
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an SkillGroup G1 with some ID as the subject skill in the given model
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, "SkillGroup 1");
        const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs);

        // AND a second skill group with the given ID in the given model
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "SkillGroup 2");
        // @ts-ignore
        givenSkillGroupSpecs_2.id = givenID.toHexString();
        const givenSkillGroup_2 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs_2);
        // guard to ensure the id is the given one
        expect(givenSkillGroup_2.id).toEqual(givenID.toHexString());

        // AND a third skill with some ID in the given model
        const givenSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "skill 1");
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);

        // AND the SkillGroup 1 is the parent of SkillGroup 2
        // AND the Skill 1 is the parent of the subject Skill
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup_1.id,
            childType: ObjectTypes.SkillGroup,
            childId: givenSkillGroup_2.id,
          },
          {
            // parent of the subject
            parentType: ObjectTypes.Skill,
            parentId: givenSkill_1.id,
            childType: ObjectTypes.Skill,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only skill 2 as a parent
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parents).toEqual([expectedSkillReference(givenSkill_1)]);
      });
    });

    test("should return the Skill with its related skills", async () => {
      // GIVEN five Skills in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (Skill)
      const givenSubjectSpecs = getSimpleNewSkillSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The requiring (Skill)
      const givenRequiringSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "requiring_1");
      const givenRequiringSkill_1 = await repository.create(givenRequiringSkillSpecs_1);

      // The requiring (Skill)
      const givenRequiringSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "requiring_2");
      const givenRequiringSkill_2 = await repository.create(givenRequiringSkillSpecs_2);

      // The required (Skill)
      const givenRequiredSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "required_1");
      const givenRequiredSkill_1 = await repository.create(givenRequiredSkillSpecs_1);

      // The required (Skill)
      const givenRequiredSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "required_2");
      const givenRequiredSkill_2 = await repository.create(givenRequiredSkillSpecs_2);

      // AND the subject Skill has two requiring and required skills
      const actualRelations = await repositoryRegistry.skillToSkillRelation.createMany(givenModelId, [
        {
          // requiring 1 of the subject
          requiringSkillId: givenRequiringSkill_1.id,
          requiredSkillId: givenSubject.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          // requiring 2 of the subject
          requiringSkillId: givenRequiringSkill_2.id,
          requiredSkillId: givenSubject.id,
          relationType: RelationType.OPTIONAL,
        },
        {
          // required 1 of the subject
          requiringSkillId: givenSubject.id,
          requiredSkillId: givenRequiredSkill_1.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          // required 1 of the subject
          requiringSkillId: givenSubject.id,
          requiredSkillId: givenRequiredSkill_2.id,
          relationType: RelationType.OPTIONAL,
        },
      ]);
      // Guard assertion
      expect(actualRelations).toHaveLength(4);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ISkillDoc>(repository.Model);
      const actualFoundSkill = (await repository.findById(givenSubject.id)) as ISkill;

      // THEN expect the ISkill to be found
      expect(actualFoundSkill).not.toBeNull();

      // AND to have the given requiredBy Skills
      expect(actualFoundSkill.requiredBySkills).toEqual(
        expect.arrayContaining<ReferenceWithRelationType<ISkillReference>>([
          expectedRelatedSkillReference(givenRequiringSkill_1, RelationType.ESSENTIAL),
          expectedRelatedSkillReference(givenRequiringSkill_2, RelationType.OPTIONAL),
        ])
      );
      // AND to have the given requires Skills
      expect(actualFoundSkill.requiresSkills).toEqual(
        expect.arrayContaining<ReferenceWithRelationType<ISkillReference>>([
          expectedRelatedSkillReference(givenRequiredSkill_1, RelationType.ESSENTIAL),
          expectedRelatedSkillReference(givenRequiredSkill_2, RelationType.OPTIONAL),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(7); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 1 for the child references,  1 for the requiresSkills, 1 for requiredBySkills and 1 for the requiredByOccupations
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the requiresSkills
          getExpectedPlan({
            collectionName: repositoryRegistry.skillToSkillRelation.relationModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              requiringSkillId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_REQUIRES_SKILLS,
          }),
          // populating the requiredBySkills
          getExpectedPlan({
            collectionName: repositoryRegistry.skillToSkillRelation.relationModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              requiredSkillId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_REQUIRED_BY_SKILLS,
          }),
        ])
      );

      // AND expect no error to be logged
      expect(console.error).toBeCalledTimes(0);
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
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiredSkill
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiresSkills).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Object is not a Skill: ${givenInconsistentPair.requiredSkillDocModel}`)
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
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiringSkill
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiresSkills).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Object is not a Skill: ${givenInconsistentPair.requiringSkillDocModel}`)
        );
      });

      test("should not find requiringSkill or requiredSkill if the relation is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the requiring and requiredSkills are in a different model than the relation
        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        const givenSkill_2 = await repository.create(givenSkillSpecs_2);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: ISkillToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3),

          relationType: RelationType.ESSENTIAL,
          requiringSkillId: new mongoose.Types.ObjectId(givenSkill_1.id), // <- This is the inconsistency
          requiringSkillDocModel: MongooseModelName.Skill, // <- This is the inconsistency

          //@ts-ignore
          requiredSkillId: new mongoose.Types.ObjectId(givenSkill_2.id),
          requiredSkillDocModel: MongooseModelName.Skill,
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
        givenSkillSpecs_2.modelId = getMockStringId(99); // <-- this is the inconsistency
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
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill_1 by its id
        jest.spyOn(console, "error");
        const givenFoundSkill_1 = await repository.findById(givenSkill_1.id);

        // THEN expect the skill to not contain the inconsistent requiredSkills
        expect(givenFoundSkill_1).not.toBeNull();
        expect(givenFoundSkill_1!.requiredBySkills).toEqual([]); // <-- The inconsistent requiredSkill is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Required skill is not in the same model as the Requiring skill`)
        );
      });

      test("should not find requiredSkill if it is not is the same model as the requiringSkill", async () => {
        // GIVEN an inconsistency was introduced, and the requiredSkill and the requiringSkill are in different models

        const givenSkillSpecs_1 = getNewSkillSpec();
        const givenSkill_1 = await repository.create(givenSkillSpecs_1);
        const givenSkillSpecs_2 = getNewSkillSpec();
        // the requiredSkill is in a different model
        givenSkillSpecs_2.modelId = getMockStringId(99); // <-- this is the inconsistency
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
        };
        await repositoryRegistry.skillToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill_2 by its id
        jest.spyOn(console, "error");
        const givenFoundSkill_2 = await repository.findById(givenSkill_1.id);

        // THEN expect the skill to not contain the inconsistent requiredSkills
        expect(givenFoundSkill_2).not.toBeNull();
        expect(givenFoundSkill_2!.requiresSkills).toEqual([]); // <-- The inconsistent requiredSkill is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Requiring skill is not in the same model as the Required skill`)
        );
      });
    });

    test("should return the skill with its related occupations", async () => {
      // GIVEN a skill exists in the database and an occupation in the same model
      const givenModelId = getMockStringId(1);
      // The subject (skill)
      const givenSubjectSpecs = getSimpleNewSkillSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // Some other skill
      const givenOtherSkillSpecs = getSimpleNewSkillSpec(givenModelId, "other skill");
      const givenOtherSkill = await repository.create(givenOtherSkillSpecs);

      // The first requiring occupation
      const givenOccupationSpecs_1: INewOccupationSpec = getSimpleNewOccupationSpec(givenModelId, "occupation_1");
      const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupationSpecs_1);

      // The second requiring occupation
      const givenOccupationSpecs_2: INewOccupationSpec = getSimpleNewOccupationSpec(givenModelId, "occupation_2", true);
      const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

      // AND the subject Skill is required by two occupation, and the other skill is required by one occupation
      const actualRequiredByOccupation = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, [
        {
          requiringOccupationId: givenOccupation_1.id,
          requiringOccupationType: OccupationType.ESCO,
          requiredSkillId: givenSubject.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          requiringOccupationId: givenOccupation_2.id,
          requiringOccupationType: OccupationType.LOCAL,
          requiredSkillId: givenSubject.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          requiringOccupationId: givenOccupation_2.id,
          requiringOccupationType: OccupationType.LOCAL,
          requiredSkillId: givenOtherSkill.id,
          relationType: RelationType.ESSENTIAL,
        },
      ]);

      // Guard assertion
      expect(actualRequiredByOccupation).toHaveLength(3);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ISkillDoc>(repository.Model);
      const actualFoundSkill = (await repository.findById(givenSubject.id)) as ISkill;

      // THEN expect the subject to be found
      expect(actualFoundSkill).not.toBeNull();

      // AND to have the given skills
      expect(actualFoundSkill.requiredByOccupations).toEqual(
        expect.arrayContaining([
          expectedRelatedOccupationReference(givenOccupation_1, RelationType.ESSENTIAL),
          expectedRelatedOccupationReference(givenOccupation_2, RelationType.ESSENTIAL),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(6); // 1 for the parent and 1 for the child hierarchies,  1 for the requiresSkills, 1 for requiredBySkills, 1 for the requiredByOccupations and 1 for the required by occupation reference
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the requiredByOccupations
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationToSkillRelation.relationModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              requiredSkillId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_REQUIRED_BY_OCCUPATIONS,
          }),
        ])
      );

      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("test Skill to Occupation relations robustness to inconsistencies", () => {
      test("should ignore requiredByOccupation that are not Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-Occupation document has a requiresSkill relation with a skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);

        // The non-Skill in this case an ISCOGroup
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenISCOGroup.id), // <- This is the inconsistency
          requiringOccupationType: OccupationType.ESCO,
          //@ts-ignore
          requiringOccupationDocModel: MongooseModelName.ISCOGroup, // <- This is the inconsistency

          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        jest.spyOn(console, "error");
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiredSkill
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiredByOccupations).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Object is not an Occupation: ${givenInconsistentPair.requiringOccupationDocModel}`)
        );
      });

      test("should not find requiredByOccupation if the relation is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the requiringOccupation and requiredSkills are in a different model than the relation
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        const givenOccupationSpecs = getNewOccupationSpec();
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockStringId(3);

        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <- This is the inconsistency

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.ESCO,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for givenSkill by its id
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent requiring occupation
        expect(actualFoundSkill).not.toBeNull();
        expect(actualFoundSkill!.requiredByOccupations).toEqual([]);
      });

      test("should not find requiredByOccupation if it is not is the same model as the requiredSkill", async () => {
        // GIVEN an inconsistency was introduced, and the requiredSkill and the requiringOccupation are in different models

        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        const givenOccupationSpecs = getNewOccupationSpec();
        givenOccupationSpecs.modelId = getMockStringId(99); // <-- this is the inconsistency
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        //@ts-ignore
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.ESCO,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill by its id
        jest.spyOn(console, "error");
        const givenFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the skill to not contain the inconsistent requiredByOccupations
        expect(givenFoundSkill).not.toBeNull();
        expect(givenFoundSkill!.requiredByOccupations).toEqual([]); // <-- The inconsistent occupation is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`RequiredBy occupation is not in the same model as the Required skill`)
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all Skills in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of Skills exist in the database for the given Model
      const givenSkills = await createSkillsInDB(givenModelId);
      // AND some other Skills exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createSkillsInDB(givenModelId_other);

      // WHEN searching for all Skills in the given model
      const actualSkills = repository.findAll(givenModelId);

      // THEN the Skills should be returned as a consumable stream that emits all Skills
      const actualSkillsArray: ISkill[] = [];
      for await (const data of actualSkills) {
        actualSkillsArray.push(data);
      }

      const expectedSkills = givenSkills.map((ISkill) => {
        const { parents, children, requiresSkills, requiredBySkills, requiredByOccupations, ...SkillData } = ISkill;
        return SkillData;
      });
      expect(actualSkillsArray).toEqual(expectedSkills);
    });

    test("should not return any Skills when the model does not have any and other models have", async () => {
      // GIVEN no Skills exist in the database for the given model
      const givenModelId = getMockStringId(1);
      // AND some other Skills exist in the database for a different model
      await createSkillsInDB(getMockStringId(2));

      // WHEN the findAll method is called
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: ISkill[] = [];
      for await (const data of actualStream) {
        receivedData.push(data);
      }
      expect(receivedData).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN an error occurs during the find operation
      const givenModelId = getMockStringId(1);
      const givenError = new Error("foo");
      jest.spyOn(repository.Model, "find").mockImplementationOnce(() => {
        throw givenError;
      });

      // THEN the findAll method should throw an error for skillGroups
      expect(() => repository.findAll(givenModelId)).toThrowError(givenError);
    });

    test("should end and emit an error if an error occurs during data retrieval in the upstream", async () => {
      // GIVEN an error occurs during the streaming of the find operation
      const givenError = new Error("foo");
      const mockStream = Readable.from([{ toObject: jest.fn() }]);
      mockStream._read = jest.fn().mockImplementation(() => {
        throw givenError;
      });
      const mockFind = jest.spyOn(repository.Model, "find");
      // @ts-ignore
      mockFind.mockReturnValue({
        cursor: jest.fn().mockImplementationOnce(() => {
          return mockStream;
        }),
      });

      // WHEN searching for all Skills in the given model
      const actualSkills = repository.findAll(getMockStringId(1));

      // THEN expect the Skills to be returned as a consumable stream that emits an error and ends
      const actualSkillsArray: IISCOGroup[] = [];
      await expect(async () => {
        for await (const data of actualSkills) {
          actualSkillsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(actualSkills.closed).toBeTruthy();
      expect(actualSkillsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestDBConnectionFailureNoSetup<unknown>(async (repositoryRegistry) => {
      const streamOfSkills = repositoryRegistry.skill.findAll(getMockStringId(1));
      for await (const _ of streamOfSkills) {
        // iterate over the stream to hot the db and trigger the error
        // do nothing
      }
      return;
    });
  });
});
