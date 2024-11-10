// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { ISkillGroupRepository } from "./skillGroupRepository";
import { INewSkillGroupSpec, ISkillGroup, ISkillGroupDoc } from "./skillGroup.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes } from "esco/common/objectTypes";
import { INewSkillSpec } from "esco/skill/skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { INewOccupationGroupSpec } from "esco/occupationGroup/OccupationGroup.types";
import {
  getNewSkillGroupSpec,
  getSimpleNewOccupationGroupSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedSkillGroupReference, expectedSkillReference } from "esco/_test_utilities/expectedReference";
import { Readable } from "node:stream";
import { getExpectedPlan, setUpPopulateWithExplain } from "../_test_utilities/queriesWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENTS } from "../skillHierarchy/skillHierarchyModel";
import { generateRandomUUIDs } from "_test_utilities/generateRandomUUIDs";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected ISkillGroup from a given ,
 * that can ebe used for assertions
 * @param givenSpec
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewSkillGroupSpec, newUUID: string): ISkillGroup {
  return {
    children: [],
    parents: [],
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the SkillGroup Repository with an in-memory mongodb", () => {
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
  let repository: ISkillGroupRepository;
  let repositoryRegistry: RepositoryRegistry;

  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillGroup;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple SkillGroups in the db,
   * @param modelId
   * @param batchSize
   */
  async function createSkillGroupsInDB(modelId: string, batchSize: number = 3) {
    const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewSkillGroupSpecs.push(getSimpleNewSkillGroupSpec(modelId, `skillGroup_${i}`));
    }
    return await repository.createMany(givenNewSkillGroupSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.OccupationGroup.Model.deleteMany({}).exec();
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
      await repositoryRegistry.skillHierarchy.hierarchyModel.deleteMany({}).exec();
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

  test("initOnce has registered the ModelRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skillGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() skill group ", () => {
    test("should successfully create a new skill group", async () => {
      // GIVEN a valid SkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new skillGroup with given specifications
      const actualNewModel = await repository.create(givenNewSkillGroupSpec);

      // THEN expect the new skillGroup to be created with the specific attributes
      const expectedNewSkillGroup: ISkillGroup = expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewModel.UUID);
      expect(actualNewModel).toEqual(expectedNewSkillGroup);
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a new skill group when the given specifications have a UUIDHistory with %i items",
      async (count: number) => {
        // GIVEN a valid SkillGroupSpec
        const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();
        givenNewSkillGroupSpec.UUIDHistory = generateRandomUUIDs(count);

        // WHEN Creating a new skillGroup with given specifications
        const actualNewModel = await repository.create(givenNewSkillGroupSpec);

        // THEN expect the new skillGroup to be created with the specific attributes
        const expectedNewSkillGroup: ISkillGroup = expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewModel.UUID);
        expect(actualNewModel).toEqual(expectedNewSkillGroup);
      }
    );

    test("should reject with an error when creating a skill group and providing a UUID", async () => {
      // GIVEN a valid newSkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new skill with the given specifications by providing a UUID
      await expect(
        repository.create({
          ...givenNewSkillGroupSpec,
          //@ts-ignore
          UUID: randomUUID(),
        })
      ).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating a skill group with an existing UUID", async () => {
        // GIVEN a SkillGroup record exists in the database
        const givenNewSkillGroupSpecSpec: INewSkillGroupSpec = getNewSkillGroupSpec();
        const givenNewModel = await repository.create(givenNewSkillGroupSpecSpec);

        // WHEN Creating a new SkillGroup with the UUID of the existing SkillGroup
        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewModel.UUID);
        const actualPromise = repository.create(givenNewSkillGroupSpecSpec);

        // THEN expect the actual promise to reject
        await expect(actualPromise).rejects.toThrow(
          expect.toMatchErrorWithCause("SkillGroupRepository.create: create failed", /duplicate key .* dup key: { UUID/)
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.create(getNewSkillGroupSpec());
    });
  });

  describe("Test createMany() skill group ", () => {
    test("should successfully create a batch of new skill groups", async () => {
      // GIVEN some valid SkillGroupSpec
      const givenBatchSize = 3;
      const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

      // THEN expect all the Skill Groups to be created with the specific attributes
      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenNewSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new skill groups even if some don't validate", async () => {
      // GIVEN two valid SkillGroupSpec
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [getNewSkillGroupSpec(), getNewSkillGroupSpec()];
      // AND two SkillGroupSpec that is invalid
      const givenInvalidSkillGroupSpec: INewSkillGroupSpec[] = [getNewSkillGroupSpec(), getNewSkillGroupSpec()];
      givenInvalidSkillGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidSkillGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: ISkillGroup[] = await repository.createMany([
        givenValidSkillGroupSpecs[0],
        ...givenInvalidSkillGroupSpec,
        givenValidSkillGroupSpecs[1],
      ]);

      // THEN expect only the valid Skill Group to be created
      expect(actualNewSkillGroups).toHaveLength(givenValidSkillGroupSpecs.length);

      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenValidSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
          })
        )
      );
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a batch of new skill groups when they have UUIDHistory with %i UUIDs",
      async (count: number) => {
        // GIVEN some valid SkillGroupSpec
        const givenBatchSize = 3;
        const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
          givenNewSkillGroupSpecs[i].UUIDHistory = generateRandomUUIDs(count);
        }

        // WHEN creating the batch of skills Groups with the given specifications
        const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

        // THEN expect all the Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenNewSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
              return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
            })
          )
        );
      }
    );

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillGroupSpec
      const givenBatchSize = 3;
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidSkillGroupSpecs[i] = getNewSkillGroupSpec();
        givenValidSkillGroupSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: INewSkillGroupSpec[] = await repository.createMany(givenValidSkillGroupSpecs);

      // THEN expect no skill to be created
      expect(actualNewSkillGroups).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 SkillGroupSpec
        const givenBatchSize = 3;
        const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
        }

        // WHEN creating the batch of skills Groups with the given specifications (the second SkillGroupSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

        // THEN expect only the first and the third the Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenNewSkillGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewSkillGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.createMany([getNewSkillGroupSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find an SkillGroup by its id", async () => {
      // GIVEN an SkillGroup exists in the database
      const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
      const givenSkillGroup = await repository.create(givenSkillGroupSpec);

      console.log(givenSkillGroup);

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById(givenSkillGroup.id);

      // THEN expect the SkillGroup to be found
      expect(actualFoundSkillGroup).toEqual(givenSkillGroup);
    });

    test("should return null if no SkillGroup with the given id exists", async () => {
      // GIVEN no SkillGroup exists in the database

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no SkillGroup to be found
      expect(actualFoundSkillGroup).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no SkillGroup exists in the database

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById("non_existing_id");

      // THEN expect no SkillGroup to be found
      expect(actualFoundSkillGroup).toBeNull();
    });

    test("should return the SkillGroup with its parents(SkillGroups) and children(SkillGroup, Skill)", async () => {
      // GIVEN four SkillGroup and one Skill exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (SkillGroup)
      const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (SkillGroup)
      const givenParentSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "parent_1");
      const givenParent_1 = await repository.create(givenParentSpecs_1);

      // The parent (SkillGroup)
      const givenParentSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "parent_2");
      const givenParent_2 = await repository.create(givenParentSpecs_2);

      // The child SkillGroup
      const givenChildSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Skill
      const givenChildSpecs_2 = getSimpleNewSkillSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.skill.create(givenChildSpecs_2);

      // AND the subject SkillGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          // parent 1 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent_1.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenSubject.id,
        },
        {
          // parent 2 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent_2.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(4);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ISkillGroupDoc>(repository.Model);
      const actualFoundSkillGroup = (await repository.findById(givenSubject.id)) as ISkillGroup;

      // THEN expect the ISkillGroup to be found
      expect(actualFoundSkillGroup).not.toBeNull();

      // AND to have the given parents
      expect(actualFoundSkillGroup.parents).toEqual(
        expect.arrayContaining([expectedSkillGroupReference(givenParent_1), expectedSkillGroupReference(givenParent_2)])
      );
      // AND to have the given children
      expect(actualFoundSkillGroup.children).toEqual(
        expect.arrayContaining([expectedSkillGroupReference(givenChild_1), expectedSkillReference(givenChild_2)])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.SkillGroup },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENTS,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.SkillGroup },
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
      beforeEach(() => {
        jest.clearAllMocks();
      });

      test("should ignore parents that are not SkillGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-SkillGroup document is a parent of an SkillGroup
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
        const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
        // The non-SkillGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(getMockStringId(1), "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkillGroup.modelId),

          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenSkillGroup.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parents).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not a SkillGroup: ${givenInconsistentPair.parentDocModel}`);
      });

      test("should ignore children that are not SkillGroups | Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-SkillGroup document is a child of an SkillGroup
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
        const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
        // The non-SkillGroup in this case an Occupation group
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getSimpleNewOccupationGroupSpec(
          getMockStringId(1),
          "group_1",
          ObjectTypes.ISCOGroup
        );
        const givenOccupationGroup = await repositoryRegistry.OccupationGroup.create(givenNewOccupationGroupSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkillGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          //@ts-ignore
          childType: ObjectTypes.ISCOGroup, // <- This is an example of an inconsistency
          childDocModel: MongooseModelName.OccupationGroup, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenOccupationGroup.id), // <- This is the inconsistency

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenSkillGroup.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Child is not a SkillGroup or Skill: ${givenInconsistentPair.childDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        const actualFoundGroup_1 = await repository.findById(givenSkillGroup_1.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]);
        expect(actualFoundGroup_1!.parents).toEqual([]);

        // WHEN searching for the SkillGroup_1 by its id
        const actualFoundGroup_2 = await repository.findById(givenSkillGroup_2.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parents).toEqual([]);
      });

      test("should not find parent if it is not in the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id),
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_1 = await repository.findById(givenSkillGroup_1.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id),
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };

        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenSkillGroup_2.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parents).toEqual([]); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        Skill
        // 1,        2,        Skill,  4,       Skill

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Skill group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND a Skill givenSkill_1 with a given ID in the given model
        const givenSkill1Specs = getSimpleNewSkillSpec(givenModelId, "Skill_1");
        // @ts-ignore
        givenSkill1Specs.id = givenID.toHexString();
        const givenSkill_1 = await repositoryRegistry.skill.create(givenSkill1Specs);
        // guard to ensure the id is the given one
        expect(givenSkill_1.id).toEqual(givenID.toHexString());

        // AND a second skill_2 with some ID  in the given model
        const givenSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "skill_2");
        const givenSkill_2 = await repositoryRegistry.skill.create(givenSkillSpecs_2);

        // AND a third skill_3 with some ID in the given model
        const givenSkillSpecs_3 = getSimpleNewSkillSpec(givenModelId, "skill_3");
        const givenSkill_3 = await repositoryRegistry.skill.create(givenSkillSpecs_3);

        // AND the skill skill_1  is the parent of skill_2
        // AND the subject SkillGroup  is the parent of Skill_3
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_3.id,
          },
          {
            parentType: ObjectTypes.Skill,
            parentId: givenSkill_1.id,
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
        expect(actualFoundSubject!.children).toEqual([expectedSkillReference(givenSkill_3)]);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating parents", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        Skill
        // 1,        2,        SkillGroup,  4,       SkillGroup

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Skill group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND a Skill givenSkill_1 with the given ID in the given model
        const givenSkill_Specs_1 = getSimpleNewSkillSpec(givenModelId, "Skill 1");
        // @ts-ignore
        givenSkill_Specs_1.id = givenID.toHexString();
        const givenSkill_1 = await repositoryRegistry.skill.create(givenSkill_Specs_1);
        // guard to ensure the id is the given one
        expect(givenSkill_1.id).toEqual(givenID.toHexString());

        // AND a skill group with some ID  in the given model
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "SkillGroup 1");
        const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs_1);

        // AND another skill group with some ID in the given model
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "Skill Group");
        const givenSkillGroup_2 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs_2);

        // AND the Skill Group 1 is the parent of Skill 1
        // AND the Skill Group 2 is the parent of the subject SkillGroup
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup_1.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_1.id,
          },
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup_2.id,
            childType: ObjectTypes.SkillGroup,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only skill 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parents).toEqual([expectedSkillGroupReference(givenSkillGroup_2)]);
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all SkillGroups in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of SkillGroups exist in the database for the given Model
      const givenSkillGroups = await createSkillGroupsInDB(givenModelId);
      // AND some other SkillGroups exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createSkillGroupsInDB(givenModelId_other);

      // WHEN searching for all SkillGroups in the given model
      const actualSkillGroups = repository.findAll(givenModelId);

      // THEN the SkillGroups should be returned as a consumable stream that emits all SkillGroups
      const actualSkillGroupsArray: ISkillGroup[] = [];
      for await (const data of actualSkillGroups) {
        actualSkillGroupsArray.push(data);
      }

      const expectedSkillGroups = givenSkillGroups.map((ISkillGroup) => {
        const { parents, children, ...SkillGroupData } = ISkillGroup;
        return SkillGroupData;
      });
      expect(actualSkillGroupsArray).toEqual(expectedSkillGroups);
    });

    test("should not return any SkillGroups when the model does not have any and other models have", async () => {
      // GIVEN no SkillGroups exist in the database for the given model
      const givenModelId = getMockStringId(1);
      // AND some other SkillGroups exist in the database for a different model
      await createSkillGroupsInDB(getMockStringId(2));

      // WHEN the findAll method is called
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: ISkillGroup[] = [];
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
      expect(() => repository.findAll(givenModelId)).toThrow(
        expect.toMatchErrorWithCause("SkillGroupRepository.findAll: findAll failed", givenError.message)
      );
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

      // WHEN searching for all SkillGroups in the given model
      const actualSkillGroups = repository.findAll(getMockStringId(1));

      // THEN expect the SkillGroups to be returned as a consumable stream that emits an error and ends
      const actualSkillGroupsArray: ISkillGroup[] = [];
      await expect(async () => {
        for await (const data of actualSkillGroups) {
          actualSkillGroupsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("SkillGroupRepository.findAll: stream failed", givenError.message)
      );
      expect(actualSkillGroups.closed).toBeTruthy();
      expect(actualSkillGroupsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.skillGroup.findAll(getMockStringId(1))
    );
  });
});
