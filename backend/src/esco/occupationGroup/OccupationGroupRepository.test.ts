// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { IOccupationGroupRepository } from "./OccupationGroupRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import {
  IOccupationGroup,
  IOccupationGroupDoc,
  IOccupationGroupReference,
  INewOccupationGroupSpec,
} from "./OccupationGroup.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { INewSkillSpec } from "esco/skill/skills.types";
import {
  getNewOccupationGroupSpec,
  getSimpleNewOccupationGroupSpec,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewSkillSpec,
  getSimpleNewLocalOccupationSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedOccupationGroupReference, expectedOccupationReference } from "esco/_test_utilities/expectedReference";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { Readable } from "node:stream";
import { getExpectedPlan, setUpPopulateWithExplain } from "esco/_test_utilities/queriesWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENT } from "esco/occupationHierarchy/occupationHierarchyModel";
import { generateRandomUUIDs } from "_test_utilities/generateRandomUUIDs";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected OccupationGroup from a given INewOccupationGroupSpec,
 * that can be used for assertions
 * @param givenSpec
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewOccupationGroupSpec, newUUID: string): IOccupationGroup {
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

describe("Test the OccupationGroup Repository with an in-memory mongodb", () => {
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
  let repository: IOccupationGroupRepository;
  let repositoryRegistry: RepositoryRegistry;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.OccupationGroup;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple OccupationGroups in the db,
   * @param modelId
   * @param batchSize
   */
  async function createOccupationGroupsInDB(modelId: string, batchSize: number = 3) {
    const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewOccupationGroupSpecs.push(getSimpleNewOccupationGroupSpec(modelId, `group_${i}`));
    }
    return await repository.createMany(givenNewOccupationGroupSpecs);
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

  test("initOnce has registered the OccupationGroupRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().OccupationGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()?.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() OccupationGroup ", () => {
    test("should successfully create a new OccupationGroup", async () => {
      // GIVEN a valid OccupationGroupSpec
      const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();

      // WHEN Creating a new OccupationGroup with given specifications
      const actualNewOccupationGroup: IOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

      // THEN expect the new OccupationGroup to be created with the specific attributes
      const expectedNewISCO: IOccupationGroup = expectedFromGivenSpec(
        givenNewOccupationGroupSpec,
        actualNewOccupationGroup.UUID
      );
      expect(actualNewOccupationGroup).toEqual(expectedNewISCO);
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a new OccupationGroup when the given specifications have UUIDHistory with %s UUIDs",
      async (count: number) => {
        // GIVEN a valid OccupationGroupSpec
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        givenNewOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(count);

        // WHEN Creating a new OccupationGroup with given specifications
        const actualNewOccupationGroup: IOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

        // THEN expect the new OccupationGroup to be created with the specific attributes
        const expectedNewISCO: IOccupationGroup = expectedFromGivenSpec(
          givenNewOccupationGroupSpec,
          actualNewOccupationGroup.UUID
        );
        expect(actualNewOccupationGroup).toEqual(expectedNewISCO);
      }
    );

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a valid OccupationGroupSpec
      const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();

      // WHEN Creating a new OccupationGroup with a provided UUID
      const actualNewOccupationGroupPromise = repository.create({
        ...givenNewOccupationGroupSpec, //@ts-ignore
        UUID: randomUUID(),
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationGroupPromise).rejects.toThrowError(
        "OccupationGroupRepository.create: create failed. UUID should not be provided."
      );
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a OccupationGroup record exists in the database
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        const givenNewOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

        // WHEN Creating a new OccupationGroup with the same UUID as the one the existing OccupationGroup
        const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewOccupationGroup.UUID);
        const actualSecondNewOccupationGroupPromise = repository.create(actualSecondNewOccupationGroupSpec);

        // Then expect the promise to reject with an error
        await expect(actualSecondNewOccupationGroupPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(
            /OccupationGroupRepository.create: create failed/,
            /duplicate key .* dup key: { UUID/
          )
        );
      });

      test("should successfully create a second Identical OccupationGroup in a different model", async () => {
        // GIVEN a OccupationGroup record exists in the database for a given model
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        await repository.create(givenNewOccupationGroupSpec);

        // WHEN Creating an identical OccupationGroup in a new model (new modelId)
        // @ts-ignore
        const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpec = {
          ...givenNewOccupationGroupSpec,
        };
        actualSecondNewOccupationGroupSpec.modelId = getMockStringId(3);
        const actualSecondNewOccupationGroupPromise = repository.create(actualSecondNewOccupationGroupSpec);

        // THEN expect the new OccupationGroup to be created
        await expect(actualSecondNewOccupationGroupPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
        // GIVEN a OccupationGroup record exists in the database
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        const givenNewModel = await repository.create(givenNewOccupationGroupSpec);

        // WHEN Creating a new OccupationGroup with the same pair of modelId and code as the ones the existing OccupationGroup
        // @ts-ignore
        const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpec = getNewOccupationGroupSpec();
        actualSecondNewOccupationGroupSpec.code = givenNewModel.code;
        actualSecondNewOccupationGroupSpec.modelId = givenNewModel.modelId;
        const actualSecondNewModelPromise = repository.create(actualSecondNewOccupationGroupSpec);

        // Then expect the promise to reject with an error
        await expect(actualSecondNewModelPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(
            /OccupationGroupRepository.create: create failed/,
            /duplicate key .* dup key: { modelId/
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.OccupationGroup.create(getNewOccupationGroupSpec());
    });
  });

  describe("Test createMany() OccupationGroup ", () => {
    test("should successfully create a batch of new OccupationGroups", async () => {
      // GIVEN some valid OccupationGroupSpec
      const givenBatchSize = 3;
      const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec();
      }

      // WHEN creating the batch of OccupationGroups with the given specifications
      const actualNewOccupationGroups: IOccupationGroup[] = await repository.createMany(givenNewOccupationGroupSpecs);

      // THEN expect all the OccupationGroups to be created with the specific attributes
      expect(actualNewOccupationGroups).toEqual(
        expect.arrayContaining(
          givenNewOccupationGroupSpecs.map((givenNewOccupationGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewOccupationGroupSpec, actualNewOccupationGroups[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new OccupationGroups even if some don't validate", async () => {
      // GIVEN two valid OccupationGroupSpec
      const givenValidOccupationGroupSpecs: INewOccupationGroupSpec[] = [
        getNewOccupationGroupSpec(),
        getNewOccupationGroupSpec(),
      ];
      // AND two OccupationGroupSpec that is invalid
      const givenInvalidOccupationGroupSpec: INewOccupationGroupSpec[] = [
        getNewOccupationGroupSpec(),
        getNewOccupationGroupSpec(),
      ];
      givenInvalidOccupationGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidOccupationGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of OccupationGroups with the given specifications
      const actualNewOccupationGroups: IOccupationGroup[] = await repository.createMany([
        givenValidOccupationGroupSpecs[0],
        ...givenInvalidOccupationGroupSpec,
        givenValidOccupationGroupSpecs[1],
      ]);

      // THEN expect only the valid OccupationGroup to be created
      expect(actualNewOccupationGroups).toHaveLength(givenValidOccupationGroupSpecs.length);
      expect(actualNewOccupationGroups).toEqual(
        expect.arrayContaining(
          givenValidOccupationGroupSpecs.map((givenNewOccupationGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewOccupationGroupSpec, actualNewOccupationGroups[index].UUID);
          })
        )
      );
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a batch of new OccupationGroups when they have UUIDHistory with %i UUIDs",
      async (count: number) => {
        // GIVEN some valid OccupationGroupSpec
        const givenBatchSize = 3;
        const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec();
          givenNewOccupationGroupSpecs[i].UUIDHistory = generateRandomUUIDs(count);
        }

        // WHEN creating the batch of OccupationGroups with the given specifications
        const actualNewOccupationGroups: IOccupationGroup[] = await repository.createMany(givenNewOccupationGroupSpecs);

        // THEN expect all the OccupationGroups to be created with the specific attributes
        expect(actualNewOccupationGroups).toEqual(
          expect.arrayContaining(
            givenNewOccupationGroupSpecs.map((givenNewOccupationGroupSpec, index) => {
              return expectedFromGivenSpec(givenNewOccupationGroupSpec, actualNewOccupationGroups[index].UUID);
            })
          )
        );
      }
    );

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid OccupationGroupSpec
      const givenBatchSize = 3;
      const givenValidOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidOccupationGroupSpecs[i] = getNewOccupationGroupSpec();
        givenValidOccupationGroupSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of OccupationGroups with the given specifications
      const actualNewOccupationGroups: INewOccupationGroupSpec[] =
        await repository.createMany(givenValidOccupationGroupSpecs);

      // THEN expect an empty array to be created
      expect(actualNewOccupationGroups).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 OccupationGroupSpec
        const givenBatchSize = 3;
        const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec();
        }

        // WHEN creating the batch of OccupationGroups with the given specifications (the second OccupationGroupSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewOccupationGroups: IOccupationGroup[] = await repository.createMany(givenNewOccupationGroupSpecs);

        // THEN expect only the first and the third the OccupationGroups to be created with the specific attributes
        expect(actualNewOccupationGroups).toEqual(
          expect.arrayContaining(
            givenNewOccupationGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewOccupationGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewOccupationGroupSpec, actualNewOccupationGroups[index].UUID);
              })
          )
        );
      });

      test("should return only the documents that did not violate the (modelId and code) unique index", async () => {
        // GIVEN 3 OccupationGroupSpec
        const givenBatchSize = 3;
        const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec();
        }

        // WHEN creating the batch of OccupationGroups with the given specifications (the second OccupationGroupSpec having the same UUID as the first one)
        givenNewOccupationGroupSpecs[1].code = givenNewOccupationGroupSpecs[0].code;
        const actualNewOccupationGroups: IOccupationGroup[] = await repository.createMany(givenNewOccupationGroupSpecs);

        // THEN expect only the first and the third the OccupationGroups to be created with the specific attributes
        expect(actualNewOccupationGroups).toEqual(
          expect.arrayContaining(
            givenNewOccupationGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewOccupationGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewOccupationGroupSpec, actualNewOccupationGroups[index].UUID);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.OccupationGroup.createMany([getNewOccupationGroupSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find an OccupationGroup by its id", async () => {
      // GIVEN an OccupationGroup exists in the database
      const givenOccupationGroupSpecs = getSimpleNewOccupationGroupSpec(getMockStringId(1), "group_1");
      const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);

      // WHEN searching for the OccupationGroup by its id
      const actualFoundOccupationGroup = await repository.findById(givenOccupationGroup.id);

      // THEN expect the OccupationGroup to be found
      expect(actualFoundOccupationGroup).toEqual(givenOccupationGroup);
    });

    test("should return null if no OccupationGroup with the given id exists", async () => {
      // GIVEN no OccupationGroup exists in the database

      // WHEN searching for the OccupationGroup by its id
      const actualFoundOccupationGroup = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no OccupationGroup to be found
      expect(actualFoundOccupationGroup).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no OccupationGroup exists in the database

      // WHEN searching for the OccupationGroup by its id
      const actualFoundOccupationGroup = await repository.findById("non_existing_id");

      // THEN expect no OccupationGroup to be found
      expect(actualFoundOccupationGroup).toBeNull();
    });

    test("should return the OccupationGroup with its parent(OccupationGroup) and children(OccupationGroup, ESCOOccupation, LocalOccupation)", async () => {
      // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (OccupationGroup)
      const givenSubjectSpecs = getSimpleNewOccupationGroupSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (OccupationGroup)
      const givenParentSpecs = getSimpleNewOccupationGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);

      // The child OccupationGroup
      const givenChildSpecs_1 = getSimpleNewOccupationGroupSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child ESCO Occupation
      const givenChildSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // The child Local Occupation
      const givenChildSpecs_3 = getSimpleNewLocalOccupationSpec(givenModelId, "child_2");
      const givenChild_3 = await repositoryRegistry.occupation.create(givenChildSpecs_3);

      // AND the subject OccupationGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.OccupationGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.OccupationGroup,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.OccupationGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.OccupationGroup,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.OccupationGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.ESCOOccupation,
          childId: givenChild_2.id,
        },
        {
          // child 3 of the subject
          parentType: ObjectTypes.OccupationGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.LocalOccupation,
          childId: givenChild_3.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(4);

      // WHEN searching for the subject by its id

      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<IOccupationGroupDoc>(repository.Model);
      const actualFoundOccupationGroup = (await repository.findById(givenSubject.id)) as IOccupationGroup;

      // THEN expect the OccupationGroup to be found
      expect(actualFoundOccupationGroup).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundOccupationGroup.parent).toEqual(expectedOccupationGroupReference(givenParent));
      // AND to have the given child
      expect(actualFoundOccupationGroup.children).toEqual(
        expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
          expectedOccupationGroupReference(givenChild_1),
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
              childType: { $eq: ObjectTypes.OccupationGroup },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.OccupationGroup },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );

      // AND expect no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("Test OccupationGroup hierarchy robustness to inconsistencies", () => {
      test("should ignore parents that are not OccupationGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-OccupationGroup document is a parent of an OccupationGroup
        const givenModelId = getMockStringId(1);
        // The OccupationGroup
        const givenOccupationGroupSpecs = getSimpleNewOccupationGroupSpec(givenModelId, "group_1");
        const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);
        // The non-OccupationGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupationGroup.modelId),

          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenOccupationGroup.id),
          childDocModel: MongooseModelName.OccupationGroup,
          childType: ObjectTypes.OccupationGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the OccupationGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenOccupationGroup.id);

        // THEN expect the OccupationGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parent).toEqual(null);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Parent is not an OccupationGroup: ${givenInconsistentPair.parentDocModel}`
        );
      });

      test("should ignore children that are not Occupation Groups | ESCO Occupations | Local Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-OccupationGroup document is a child of an OccupationGroup
        const givenModelId = getMockStringId(1);
        // The OccupationGroup
        const givenOccupationGroupSpecs = getSimpleNewOccupationGroupSpec(getMockStringId(1), "group_1");
        const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);
        // The non-OccupationGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupationGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup.id),
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: ObjectTypes.OccupationGroup,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the OccupationGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenOccupationGroup.id);

        // THEN expect the OccupationGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Child is not an OccupationGroup or ESCO Occupation or Local Occupation: ${givenInconsistentPair.childDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The OccupationGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenModelId_1, "group_1");
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationGroupSpecs_2 = getSimpleNewOccupationGroupSpec(givenModelId_2, "group_2");
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: ObjectTypes.OccupationGroup,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.OccupationGroup,
          childType: ObjectTypes.OccupationGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation Group_1 by its id
        const actualFoundGroup_1 = await repository.findById(givenOccupationGroup_1.id);

        // THEN expect the OccupationGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]);
        expect(actualFoundGroup_1!.parent).toEqual(null);

        // WHEN searching for the Occupation Group_1 by its id
        const actualFoundGroup_2 = await repository.findById(givenOccupationGroup_2.id);

        // THEN expect the OccupationGroup to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parent).toEqual(null);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The OccupationGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenModelId_1, "group_1");
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationGroupSpecs_2 = getSimpleNewOccupationGroupSpec(givenModelId_2, "group_2");
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id),
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: ObjectTypes.OccupationGroup,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.OccupationGroup,
          childType: ObjectTypes.OccupationGroup,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation Group_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_1 = await repository.findById(givenOccupationGroup_1.id);

        // THEN expect the OccupationGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Child is not in the same model as the parent`));
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The OccupationGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenModelId_1, "group_1");
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationGroupSpecs_2 = getSimpleNewOccupationGroupSpec(givenModelId_2, "group_2");
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: ObjectTypes.OccupationGroup,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id),
          childDocModel: MongooseModelName.OccupationGroup,
          childType: ObjectTypes.OccupationGroup,
        };

        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation Group_2 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenOccupationGroup_2.id);

        // THEN expect the OccupationGroup to not contain the inconsistent parent
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
        // 1,        2,        OccupationGroup,  3,        ESCO Occupation
        // 1,        2,        ESCO Occupation,  4,       ESCO Occupation

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Occupation group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewOccupationGroupSpec(givenModelId, "subject");
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
        // AND the subject OccupationGroup  is the parent of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.OccupationGroup,
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
        // 1,        2,        OccupationGroup,  4,        ESCO Occupation
        // 1,        3,        OccupationGroup,  4,       OccupationGroup

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Occupation group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewOccupationGroupSpec(givenModelId, "subject");
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

        // AND a second occupationGroup with some ID in the given model
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenModelId, "isco_1");
        const givenOccupationGroup_1 = await repositoryRegistry.OccupationGroup.create(givenOccupationGroupSpecs_1);

        // AND a third occupationGroup with some ID  in the given model
        const givenOccupationGroupSpecs_2 = getSimpleNewOccupationGroupSpec(givenModelId, "isco_2");
        const givenOccupationGroup_2 = await repositoryRegistry.OccupationGroup.create(givenOccupationGroupSpecs_2);

        // AND the occupation occupation_1  is the child of occupationGroup_2
        // AND the subject OccupationGroup  is the child of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.OccupationGroup,
            parentId: givenOccupationGroup_1.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenOccupation_1.id,
          },
          {
            parentType: ObjectTypes.OccupationGroup,
            parentId: givenOccupationGroup_2.id,
            childType: ObjectTypes.OccupationGroup,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a parent
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parent).toEqual(expectedOccupationGroupReference(givenOccupationGroup_2));
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.OccupationGroup.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all OccupationGroups in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of OccupationGroups exist in the database for a given Model
      const givenOccupationGroups = await createOccupationGroupsInDB(givenModelId);
      // AND some other OccupationGroups exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createOccupationGroupsInDB(givenModelId_other);

      // WHEN searching for all OccupationGroups in the given model of a given type
      const actualOccupationGroups = repository.findAll(givenModelId);

      // THEN the OccupationGroups should be returned as a consumable stream that emits all OccupationGroups
      const actualOccupationGroupsArray: IOccupationGroup[] = [];
      for await (const data of actualOccupationGroups) {
        actualOccupationGroupsArray.push(data);
      }

      const expectedOccupationGroups = givenOccupationGroups.map((OccupationGroup) => {
        const { parent, children, ...OccupationGroupData } = OccupationGroup;
        return OccupationGroupData;
      });
      expect(actualOccupationGroupsArray).toEqual(expectedOccupationGroups);
    });

    test("should not return any OccupationGroups when the model does not have any and other models have", async () => {
      // GIVEN no OccupationGroups exist in the database for the given model
      const givenModelId = getMockStringId(1);
      const givenModelId_other = getMockStringId(2);
      // BUT some other OccupationGroups exist in the database for a different model
      await createOccupationGroupsInDB(givenModelId_other);

      // WHEN the findAll method is called for OccupationGroups
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: IOccupationGroup[] = [];
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
        expect.toMatchErrorWithCause("OccupationGroupRepository.findAll: findAll failed", givenError.message)
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

      // WHEN searching for all OccupationGroups in the given model of a given type
      const actualOccupationGroups = repository.findAll(getMockStringId(1));

      // THEN the OccupationGroups should be returned as a consumable stream that emits an error and ends
      const actualOccupationGroupsArray: IOccupationGroup[] = [];
      await expect(async () => {
        for await (const data of actualOccupationGroups) {
          actualOccupationGroupsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("OccupationGroupRepository.findAll: stream failed", givenError.message)
      );
      expect(actualOccupationGroups.closed).toBeTruthy();
      expect(actualOccupationGroupsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.OccupationGroup.findAll(getMockStringId(1))
    );
  });
});
