// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { IISCOGroupRepository } from "./ISCOGroupRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { IISCOGroup, IISCOGroupDoc, IISCOGroupReference, INewISCOGroupSpec } from "./ISCOGroup.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { INewSkillSpec } from "esco/skill/skills.types";
import {
  getNewISCOGroupSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewSkillSpec,
  getSimpleNewLocalOccupationSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedISCOGroupReference, expectedOccupationReference } from "esco/_test_utilities/expectedReference";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { Readable } from "node:stream";
import { getExpectedPlan, setUpPopulateWithExplain } from "esco/_test_utilities/queriesWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENT } from "esco/occupationHierarchy/occupationHierarchyModel";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected ISCOGroup from a given INewISCOGroupSpec,
 * that can be used for assertions
 * @param givenSpec
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewISCOGroupSpec, newUUID: string): IISCOGroup {
  return {
    ...givenSpec,
    id: expect.any(String),
    parent: null,
    children: [],
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the ISCOGroup Repository with an in-memory mongodb", () => {
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
  let repository: IISCOGroupRepository;
  let repositoryRegistry: RepositoryRegistry;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ISCOGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.ISCOGroup;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple ISCOGroups in the db,
   * @param modelId
   * @param batchSize
   */
  async function createISCOGroupsInDB(modelId: string, batchSize: number = 3) {
    const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewISCOGroupSpecs.push(getSimpleNewISCOGroupSpec(modelId, `group_${i}`));
    }
    return await repository.createMany(givenNewISCOGroupSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.occupation.Model.deleteMany({}).exec();
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
      await repositoryRegistry.occupationHierarchy.hierarchyModel.deleteMany({}).exec();
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

  test("initOnce has registered the ISCOGroupRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().ISCOGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()?.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() ISCOGroup ", () => {
    test("should successfully create a new ISCOGroup", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCOGroup with given specifications
      const actualNewISCOGroup: IISCOGroup = await repository.create(givenNewISCOGroupSpec);

      // THEN expect the new ISCOGroup to be created with the specific attributes
      const expectedNewISCO: IISCOGroup = expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroup.UUID);
      expect(actualNewISCOGroup).toEqual(expectedNewISCO);
    });

    test("should successfully create a new ISCOGroup when the given specifications have an empty UUIDHistory", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      givenNewISCOGroupSpec.UUIDHistory = [];

      // WHEN Creating a new ISCOGroup with given specifications
      const actualNewISCOGroup: IISCOGroup = await repository.create(givenNewISCOGroupSpec);

      // THEN expect the new ISCOGroup to be created with the specific attributes
      const expectedNewISCO: IISCOGroup = expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroup.UUID);
      expect(actualNewISCOGroup).toEqual(expectedNewISCO);
    });

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCOGroup with a provided UUID
      const actualNewISCOGroupPromise = repository.create({
        ...givenNewISCOGroupSpec, //@ts-ignore
        UUID: randomUUID(),
      });

      // Then expect the promise to reject with an error
      await expect(actualNewISCOGroupPromise).rejects.toThrowError(
        "ISCOGroupRepository.create: create failed. UUID should not be provided."
      );
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a ISCOGroup record exists in the database
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenNewISCOGroup = await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating a new ISCOGroup with the same UUID as the one the existing ISCOGroup
        const actualSecondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewISCOGroup.UUID);
        const actualSecondNewISCOGroupPromise = repository.create(actualSecondNewISCOGroupSpec);

        // Then expect the promise to reject with an error
        await expect(actualSecondNewISCOGroupPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(/ISCOGroupRepository.create: create failed/, /duplicate key .* dup key: { UUID/)
        );
      });

      test("should successfully create a second Identical ISCOGroup in a different model", async () => {
        // GIVEN a ISCOGroup record exists in the database for a given model
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating an identical ISCOGroup in a new model (new modelId)
        // @ts-ignore
        const actualSecondNewISCOGroupSpec: INewISCOGroupSpec = {
          ...givenNewISCOGroupSpec,
        };
        actualSecondNewISCOGroupSpec.modelId = getMockStringId(3);
        const actualSecondNewISCOGroupPromise = repository.create(actualSecondNewISCOGroupSpec);

        // THEN expect the new ISCOGroup to be created
        await expect(actualSecondNewISCOGroupPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
        // GIVEN a ISCOGroup record exists in the database
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenNewModel = await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating a new ISCOGroup with the same pair of modelId and code as the ones the existing ISCOGroup
        // @ts-ignore
        const actualSecondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        actualSecondNewISCOGroupSpec.code = givenNewModel.code;
        actualSecondNewISCOGroupSpec.modelId = givenNewModel.modelId;
        const actualSecondNewModelPromise = repository.create(actualSecondNewISCOGroupSpec);

        // Then expect the promise to reject with an error
        await expect(actualSecondNewModelPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(
            /ISCOGroupRepository.create: create failed/,
            /duplicate key .* dup key: { modelId/
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.ISCOGroup.create(getNewISCOGroupSpec());
    });
  });

  describe("Test createMany() ISCOGroup ", () => {
    test("should successfully create a batch of new ISCOGroups", async () => {
      // GIVEN some valid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewISCOGroups: IISCOGroup[] = await repository.createMany(givenNewISCOGroupSpecs);

      // THEN expect all the ISCOGroups to be created with the specific attributes
      expect(actualNewISCOGroups).toEqual(
        expect.arrayContaining(
          givenNewISCOGroupSpecs.map((givenNewISCOGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroups[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new ISCOGroups even if some don't validate", async () => {
      // GIVEN two valid ISCOGroupSpec
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [getNewISCOGroupSpec(), getNewISCOGroupSpec()];
      // AND two ISCOGroupSpec that is invalid
      const givenInvalidISCOGroupSpec: INewISCOGroupSpec[] = [getNewISCOGroupSpec(), getNewISCOGroupSpec()];
      givenInvalidISCOGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidISCOGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewISCOGroups: IISCOGroup[] = await repository.createMany([
        givenValidISCOGroupSpecs[0],
        ...givenInvalidISCOGroupSpec,
        givenValidISCOGroupSpecs[1],
      ]);

      // THEN expect only the valid ISCOGroup to be created
      expect(actualNewISCOGroups).toHaveLength(givenValidISCOGroupSpecs.length);
      expect(actualNewISCOGroups).toEqual(
        expect.arrayContaining(
          givenValidISCOGroupSpecs.map((givenNewISCOGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroups[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new ISCOGroups when they have an empty UUIDHistory", async () => {
      // GIVEN some valid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
        givenNewISCOGroupSpecs[i].UUIDHistory = []; // empty UUIDHistory
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewISCOGroups: IISCOGroup[] = await repository.createMany(givenNewISCOGroupSpecs);

      // THEN expect all the ISCOGroups to be created with the specific attributes
      expect(actualNewISCOGroups).toEqual(
        expect.arrayContaining(
          givenNewISCOGroupSpecs.map((givenNewISCOGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroups[index].UUID);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidISCOGroupSpecs[i] = getNewISCOGroupSpec();
        givenValidISCOGroupSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenValidISCOGroupSpecs);

      // THEN expect an empty array to be created
      expect(actualNewISCOGroups).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 ISCOGroupSpec
        const givenBatchSize = 3;
        const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
        }

        // WHEN creating the batch of ISCOGroups with the given specifications (the second ISCOGroupSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewISCOGroups: IISCOGroup[] = await repository.createMany(givenNewISCOGroupSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewISCOGroups).toEqual(
          expect.arrayContaining(
            givenNewISCOGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewISCOGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroups[index].UUID);
              })
          )
        );
      });

      test("should return only the documents that did not violate the (modelId and code) unique index", async () => {
        // GIVEN 3 ISCOGroupSpec
        const givenBatchSize = 3;
        const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
        }

        // WHEN creating the batch of ISCOGroups with the given specifications (the second ISCOGroupSpec having the same UUID as the first one)
        givenNewISCOGroupSpecs[1].code = givenNewISCOGroupSpecs[0].code;
        const actualNewISCOGroups: IISCOGroup[] = await repository.createMany(givenNewISCOGroupSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewISCOGroups).toEqual(
          expect.arrayContaining(
            givenNewISCOGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewISCOGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewISCOGroupSpec, actualNewISCOGroups[index].UUID);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.ISCOGroup.createMany([getNewISCOGroupSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find an ISCOGroup by its id", async () => {
      // GIVEN an ISCOGroup exists in the database
      const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockStringId(1), "group_1");
      const givenISCOGroup = await repository.create(givenISCOGroupSpecs);

      // WHEN searching for the ISCOGroup by its id
      const actualFoundISCOGroup = await repository.findById(givenISCOGroup.id);

      // THEN expect the ISCOGroup to be found
      expect(actualFoundISCOGroup).toEqual(givenISCOGroup);
    });

    test("should return null if no ISCOGroup with the given id exists", async () => {
      // GIVEN no ISCOGroup exists in the database

      // WHEN searching for the ISCOGroup by its id
      const actualFoundISCOGroup = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no ISCOGroup to be found
      expect(actualFoundISCOGroup).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no ISCOGroup exists in the database

      // WHEN searching for the ISCOGroup by its id
      const actualFoundISCOGroup = await repository.findById("non_existing_id");

      // THEN expect no ISCOGroup to be found
      expect(actualFoundISCOGroup).toBeNull();
    });

    test("should return the ISCOGroup with its parent(ISCOGroup) and children(ISCOGroup, ESCOOccupation, LocalOccupation)", async () => {
      // GIVEN three ISCOGroups and one Occupation exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (ISCOGroup)
      const givenSubjectSpecs = getSimpleNewISCOGroupSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (ISCOGroup)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);

      // The child ISCOGroup
      const givenChildSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child ESCO Occupation
      const givenChildSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // The child Local Occupation
      const givenChildSpecs_3 = getSimpleNewLocalOccupationSpec(givenModelId, "child_2");
      const givenChild_3 = await repositoryRegistry.occupation.create(givenChildSpecs_3);

      // AND the subject ISCOGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.ISCOGroup,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.ISCOGroup,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.ESCOOccupation,
          childId: givenChild_2.id,
        },
        {
          // child 3 of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.LocalOccupation,
          childId: givenChild_3.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(4);

      // WHEN searching for the subject by its id

      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<IISCOGroupDoc>(repository.Model);
      const actualFoundISCOGroup = (await repository.findById(givenSubject.id)) as IISCOGroup;

      // THEN expect the ISCOGroup to be found
      expect(actualFoundISCOGroup).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundISCOGroup.parent).toEqual(expectedISCOGroupReference(givenParent));
      // AND to have the given child
      expect(actualFoundISCOGroup.children).toEqual(
        expect.arrayContaining<IISCOGroupReference | IOccupationReference>([
          expectedISCOGroupReference(givenChild_1),
          expectedOccupationReference(givenChild_2),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.ISCOGroup },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.ISCOGroup },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );

      // AND expect no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("Test ISCOGroup hierarchy robustness to inconsistencies", () => {
      test("should ignore parents that are not ISCOGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a parent of an ISCOGroup
        const givenModelId = getMockStringId(1);
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(givenModelId, "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenISCOGroup.modelId),

          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenISCOGroup.id),
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCOGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parent).toEqual(null);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not an ISCOGroup: ${givenInconsistentPair.parentDocModel}`);
      });

      test("should ignore children that are not ISCO Groups | ESCO Occupations | Local Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a child of an ISCOGroup
        const givenModelId = getMockStringId(1);
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockStringId(1), "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenISCOGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup.id),
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCOGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Child is not an ISCOGroup or ESCO Occupation or Local Occupation: ${givenInconsistentPair.childDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The ISCOGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId_2, "group_2");
        const givenISCOGroup_2 = await repository.create(givenISCOGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCO Group_1 by its id
        const actualFoundGroup_1 = await repository.findById(givenISCOGroup_1.id);

        // THEN expect the ISCOGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]);
        expect(actualFoundGroup_1!.parent).toEqual(null);

        // WHEN searching for the ISCO Group_1 by its id
        const actualFoundGroup_2 = await repository.findById(givenISCOGroup_2.id);

        // THEN expect the ISCOGroup to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parent).toEqual(null);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The ISCOGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId_2, "group_2");
        const givenISCOGroup_2 = await repository.create(givenISCOGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id),
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCO Group_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_1 = await repository.findById(givenISCOGroup_1.id);

        // THEN expect the ISCOGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Child is not in the same model as the parent`));
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The ISCOGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId_2, "group_2");
        const givenISCOGroup_2 = await repository.create(givenISCOGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id),
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        };

        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCO Group_2 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenISCOGroup_2.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Parent is not in the same model as the child`));
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency,
        // if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        ISCOGroup,  3,        ESCO Occupation
        // 1,        2,        ESCO Occupation,  4,       ESCO Occupation

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject ISCO group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewISCOGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an Occupation givenOccupation_1 with a given ID in the given model
        const givenOccupation1Specs = getSimpleNewESCOOccupationSpec(givenModelId, "Occupation_1");
        // @ts-ignore
        givenOccupation1Specs.id = givenID.toHexString();
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupation1Specs);
        // guard to ensure the id is the given one
        expect(givenOccupation_1.id).toEqual(givenID.toHexString());

        // AND a second occupation_2 with some ID  in the given model
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "occupation_2");
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // AND a third occupation_3 with some ID in the given model
        const givenOccupationSpecs_3 = getSimpleNewESCOOccupationSpec(givenModelId, "occupation_3");
        const givenOccupation_3 = await repositoryRegistry.occupation.create(givenOccupationSpecs_3);

        // AND the occupation occupation_1  is the parent of occupation_2
        // AND the subject ISCOGroup  is the parent of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenOccupation_3.id,
          },
          {
            parentType: ObjectTypes.ESCOOccupation,
            parentId: givenOccupation_1.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenOccupation_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.children).toEqual([expectedOccupationReference(givenOccupation_3)]);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating parent", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        ISCOGroup,  4,        ESCO Occupation
        // 1,        3,        ISCOGroup,  4,       ISCOGroup

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject ISCO group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewISCOGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an Occupation givenOccupation_1 with a given ID in the given model
        const givenOccupation1Specs = getSimpleNewESCOOccupationSpec(givenModelId, "Occupation_1");
        // @ts-ignore
        givenOccupation1Specs.id = givenID.toHexString();
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupation1Specs);
        // guard to ensure the id is the given one
        expect(givenOccupation_1.id).toEqual(givenID.toHexString());

        // AND a second iscoGroup with some ID in the given model
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId, "isco_1");
        const givenISCOGroup_1 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpecs_1);

        // AND a third iscoGroup with some ID  in the given model
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId, "isco_2");
        const givenISCOGroup_2 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpecs_2);

        // AND the occupation occupation_1  is the child of iscoGroup_2
        // AND the subject ISCOGroup  is the child of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup_1.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenOccupation_1.id,
          },
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup_2.id,
            childType: ObjectTypes.ISCOGroup,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a parent
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parent).toEqual(expectedISCOGroupReference(givenISCOGroup_2));
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.ISCOGroup.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all ISCOGroups in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of ISCOGroups exist in the database for a given Model
      const givenISCOGroups = await createISCOGroupsInDB(givenModelId);
      // AND some other ISCOGroups exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createISCOGroupsInDB(givenModelId_other);

      // WHEN searching for all ISCOGroups in the given model of a given type
      const actualISCOGroups = repository.findAll(givenModelId);

      // THEN the ISCOGroups should be returned as a consumable stream that emits all ISCOGroups
      const actualISCOGroupsArray: IISCOGroup[] = [];
      for await (const data of actualISCOGroups) {
        actualISCOGroupsArray.push(data);
      }

      const expectedISCOGroups = givenISCOGroups.map((ISCOGroup) => {
        const { parent, children, ...ISCOGroupData } = ISCOGroup;
        return ISCOGroupData;
      });
      expect(actualISCOGroupsArray).toEqual(expectedISCOGroups);
    });

    test("should not return any ISCOGroups when the model does not have any and other models have", async () => {
      // GIVEN no ISCOGroups exist in the database for the given model
      const givenModelId = getMockStringId(1);
      const givenModelId_other = getMockStringId(2);
      // BUT some other ISCOGroups exist in the database for a different model
      await createISCOGroupsInDB(givenModelId_other);

      // WHEN the findAll method is called for ISCOGroups
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: IISCOGroup[] = [];
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

      // THEN the findAll method should throw an error for occupations
      expect(() => repository.findAll(givenModelId)).toThrow(
        expect.toMatchErrorWithCause("ISCOGroupRepository.findAll: findAll failed", givenError.message)
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

      // WHEN searching for all ISCOGroups in the given model of a given type
      const actualISCOGroups = repository.findAll(getMockStringId(1));

      // THEN the ISCOGroups should be returned as a consumable stream that emits an error and ends
      const actualISCOGroupsArray: IISCOGroup[] = [];
      await expect(async () => {
        for await (const data of actualISCOGroups) {
          actualISCOGroupsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("ISCOGroupRepository.findAll: stream failed", givenError.message)
      );
      expect(actualISCOGroups.closed).toBeTruthy();
      expect(actualISCOGroupsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.ISCOGroup.findAll(getMockStringId(1))
    );
  });
});
