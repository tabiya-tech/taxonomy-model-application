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
  INewOccupationGroupSpec,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  IOccupationGroupDoc,
  IOccupationGroupReference,
  IOccupationGroupWithoutImportId,
} from "./OccupationGroup.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { INewSkillSpec } from "esco/skill/skills.types";
import {
  getNewISCOGroupSpecs,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewSkillSpec,
  getSimpleNewLocalGroupSpec,
  getNewLocalGroupSpecs,
  getSimpleNewISCOGroupSpecWithParentCode,
  getSimpleNewESCOOccupationSpecWithParentCode,
  getSimpleNewLocalOccupationSpecWithParentCode,
  getSimpleNewLocalGroupSpecWithParentCode,
  getNewISCOGroupSpecsWithoutImportId,
  getNewLocalGroupSpecsWithoutImportId,
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
import { resetMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";

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

function expectedFromGivenSpecWithoutImportId(
  givenSpec: INewOccupationGroupSpecWithoutImportId,
  newUUID: string
): IOccupationGroupWithoutImportId {
  return {
    ...givenSpec,
    id: expect.any(String),
    parent: null,
    children: [],
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    importId: null,
  };
}

describe("Test the OccupationGroup Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
  });
  afterEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
    // reset the code between tests so that we dont run out of codes when we're building hierarchies.
    // This is important because codes for entities in hierarchies are based on their parents and appended after each other,
    // if the codes are not reset between tests, the codes will be appended after each other will cause the code to be too long.
    resetMockRandomISCOGroupCode();
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
      const givenNewOccupationGroupSpec =
        i % 2 === 0
          ? getSimpleNewISCOGroupSpec(modelId, `group_${i}`)
          : getSimpleNewLocalGroupSpec(modelId, `group_${i}`);
      givenNewOccupationGroupSpecs.push(givenNewOccupationGroupSpec);
    }
    return await repository.createMany(givenNewOccupationGroupSpecs);
  }

  function getNewOccupationGroupSpec(groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup) {
    if (groupType === ObjectTypes.ISCOGroup) {
      return getNewISCOGroupSpecs();
    } else if (groupType === ObjectTypes.LocalGroup) {
      return getNewLocalGroupSpecs();
    } else {
      throw new Error(`Unsupported groupType: ${groupType}`);
    }
  }

  function getNewOccupationGroupSpecWithoutImportId(groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup) {
    if (groupType === ObjectTypes.ISCOGroup) {
      return getNewISCOGroupSpecsWithoutImportId();
    } else if (groupType === ObjectTypes.LocalGroup) {
      return getNewLocalGroupSpecsWithoutImportId();
    } else {
      throw new Error(`Unsupported groupType: ${groupType}`);
    }
  }

  function getSimpleNewOccupationGroupSpec(
    groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup,
    modelId: string,
    preferredLabel: string,
    leafNode: boolean = false
  ) {
    if (groupType === ObjectTypes.ISCOGroup) {
      return getSimpleNewISCOGroupSpec(modelId, preferredLabel, leafNode);
    } else if (groupType === ObjectTypes.LocalGroup) {
      return getSimpleNewLocalGroupSpec(modelId, preferredLabel);
    } else {
      throw new Error(`Unsupported groupType: ${groupType}`);
    }
  }

  function getSimpleNewOccupationGroupSpecWithParentCode(
    groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup,
    modelId: string,
    preferredLabel: string,
    parentCode: string,
    leafNode: boolean = false
  ) {
    if (groupType === ObjectTypes.ISCOGroup) {
      return getSimpleNewISCOGroupSpecWithParentCode(modelId, preferredLabel, parentCode, leafNode);
    } else if (groupType === ObjectTypes.LocalGroup) {
      return getSimpleNewLocalGroupSpecWithParentCode(modelId, preferredLabel, parentCode);
    } else {
      throw new Error(`Unsupported groupType: ${groupType}`);
    }
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.OccupationGroup.Model.deleteMany({}).exec();
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

  describe.each<ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup>([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup])(
    "Test create() %s ",
    (givenGroupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup) => {
      test("should successfully create a new %s", async () => {
        // GIVEN a valid OccupationGroupSpec
        const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
          getNewOccupationGroupSpecWithoutImportId(givenGroupType);

        // WHEN Creating a new OccupationGroup with given specifications
        const actualNewOccupationGroup: IOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

        // THEN expect the new OccupationGroup to be created with the specific attributes
        const expectedNewISCO: IOccupationGroupWithoutImportId = expectedFromGivenSpecWithoutImportId(
          givenNewOccupationGroupSpec,
          actualNewOccupationGroup.UUID
        );
        expect(actualNewOccupationGroup).toEqual(expectedNewISCO);
      });

      test.each([0, 1, 2, 10])(
        "should successfully create a new OccupationGroup when the given specifications have UUIDHistory with %s UUIDs",
        async (count: number) => {
          // GIVEN a valid OccupationGroupSpec
          const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
          givenNewOccupationGroupSpec.UUIDHistory = generateRandomUUIDs(count);

          // WHEN Creating a new OccupationGroup with given specifications
          const actualNewOccupationGroup: IOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

          // THEN expect the new OccupationGroup to be created with the specific attributes
          const expectedNewISCO: IOccupationGroupWithoutImportId = expectedFromGivenSpecWithoutImportId(
            givenNewOccupationGroupSpec,
            actualNewOccupationGroup.UUID
          );
          expect(actualNewOccupationGroup).toEqual(expectedNewISCO);
        }
      );

      test("should reject with an error when creating a model and providing a UUID", async () => {
        // GIVEN a valid OccupationGroupSpec
        const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
          getNewOccupationGroupSpecWithoutImportId(givenGroupType);

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
          const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
          const givenNewOccupationGroup = await repository.create(givenNewOccupationGroupSpec);

          // WHEN Creating a new OccupationGroup with the same UUID as the one the existing OccupationGroup
          const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
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
          const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
          await repository.create(givenNewOccupationGroupSpec);

          // WHEN Creating an identical OccupationGroup in a new model (new modelId)
          // @ts-ignore
          const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId = {
            ...givenNewOccupationGroupSpec,
          };
          actualSecondNewOccupationGroupSpec.modelId = getMockStringId(3);
          const actualSecondNewOccupationGroupPromise = repository.create(actualSecondNewOccupationGroupSpec);

          // THEN expect the new OccupationGroup to be created
          await expect(actualSecondNewOccupationGroupPromise).resolves.toBeDefined();
        });

        test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
          // GIVEN a OccupationGroup record exists in the database
          const givenNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
          const givenNewModel = await repository.create(givenNewOccupationGroupSpec);

          // WHEN Creating a new OccupationGroup with the same pair of modelId and code as the ones the existing OccupationGroup
          // @ts-ignore
          const actualSecondNewOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId =
            getNewOccupationGroupSpecWithoutImportId(givenGroupType);
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
        return repositoryRegistry.OccupationGroup.create(getNewOccupationGroupSpec(givenGroupType));
      });
    }
  );

  describe.each<ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup>([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup])(
    "Test createMany() %s ",
    (givenGroupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup) => {
      test("should successfully create a batch of new OccupationGroups", async () => {
        // GIVEN some valid OccupationGroupSpec
        const givenBatchSize = 3;
        const givenNewOccupationGroupSpecs: INewOccupationGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec(givenGroupType);
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
          getNewOccupationGroupSpec(givenGroupType),
          getNewOccupationGroupSpec(givenGroupType),
        ];
        // AND two OccupationGroupSpec that is invalid
        const givenInvalidOccupationGroupSpec: INewOccupationGroupSpec[] = [
          getNewOccupationGroupSpec(givenGroupType),
          getNewOccupationGroupSpec(givenGroupType),
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
            givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec(givenGroupType);
            givenNewOccupationGroupSpecs[i].UUIDHistory = generateRandomUUIDs(count);
          }

          // WHEN creating the batch of OccupationGroups with the given specifications
          const actualNewOccupationGroups: IOccupationGroup[] =
            await repository.createMany(givenNewOccupationGroupSpecs);

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
          givenValidOccupationGroupSpecs[i] = getNewOccupationGroupSpec(givenGroupType);
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
            givenNewOccupationGroupSpecs[i] = getNewOccupationGroupSpec(givenGroupType);
          }

          // WHEN creating the batch of OccupationGroups with the given specifications (the second OccupationGroupSpec having the same UUID as the first one)
          (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
          (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
          const actualNewOccupationGroups: IOccupationGroup[] =
            await repository.createMany(givenNewOccupationGroupSpecs);

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
            givenNewOccupationGroupSpecs[i] = getNewISCOGroupSpecs();
          }

          // WHEN creating the batch of OccupationGroups with the given specifications (the second OccupationGroupSpec having the same UUID as the first one)
          givenNewOccupationGroupSpecs[1].code = givenNewOccupationGroupSpecs[0].code;
          const actualNewOccupationGroups: IOccupationGroup[] =
            await repository.createMany(givenNewOccupationGroupSpecs);

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
        return repositoryRegistry.OccupationGroup.createMany([getNewOccupationGroupSpec(givenGroupType)]);
      });
    }
  );

  describe("Test findById()", () => {
    test("should find an OccupationGroup by its id", async () => {
      // GIVEN an OccupationGroup exists in the database
      const givenOccupationGroupSpecs = getSimpleNewISCOGroupSpec(getMockStringId(1), "group_1");
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

    describe("should return the OccupationGroup with its parent and children", () => {
      test("should return the ISCOGroup with its parent(ISCOGroup) and children occupations(ESCOOccupation, LocalOccupation)", async () => {
        // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
        const givenModelId = getMockStringId(1);

        // The root parent (OccupationGroup)
        const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
        const givenParent = await repository.create(givenParentSpecs);
        // The 2nd level parent (OccupationGroup)
        const givenParentSpecs_2 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "parent_2", givenParent.code);
        const givenParent_2 = await repository.create(givenParentSpecs_2);
        // The 3rd level parent (OccupationGroup)
        const givenParentSpecs_3 = getSimpleNewISCOGroupSpecWithParentCode(
          givenModelId,
          "parent_3",
          givenParent_2.code
        );
        const givenParent_3 = await repository.create(givenParentSpecs_3);

        // THE subject (OccupationGroup)
        const givenSubjectSpecs = getSimpleNewISCOGroupSpecWithParentCode(
          givenModelId,
          "subject",
          givenParent_3.code,
          true
        );
        const givenSubject = await repository.create(givenSubjectSpecs);

        // The child ESCO Occupation
        const givenChildSpecs_1 = getSimpleNewESCOOccupationSpecWithParentCode(
          givenModelId,
          "child_2",
          givenSubject.code
        );
        const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);

        // The child Local Occupation
        const givenChildSpecs_2 = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "child_3",
          givenSubject.code
        );
        const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

        // AND the subject OccupationGroup has a parent and two children
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenParent_3.id,
            childType: ObjectTypes.ISCOGroup,
            childId: givenSubject.id,
          },
          {
            // child 1 of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenChild_1.id,
          },
          {
            // child 2 of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalOccupation,
            childId: givenChild_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(3);

        // WHEN searching for the subject by its id

        // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
        const actualPlans = setUpPopulateWithExplain<IOccupationGroupDoc>(repository.Model);
        const actualFoundOccupationGroup = (await repository.findById(givenSubject.id)) as IOccupationGroup;

        // THEN expect the OccupationGroup to be found
        expect(actualFoundOccupationGroup).not.toBeNull();

        // AND to have the given parent
        expect(actualFoundOccupationGroup.parent).toEqual(expectedOccupationGroupReference(givenParent_3));
        // AND to have the given child
        expect(actualFoundOccupationGroup.children).toEqual(
          expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
            // expectedOccupationGroupReference(givenChild_1),
            expectedOccupationReference(givenChild_1),
            expectedOccupationReference(givenChild_2),
          ])
        );

        // AND expect the populate query plan to use the correct indexes
        expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
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

      test("should return the ISCOGroup with its parent(ISCOGroup) and children groups(ISCOGroup, LocalGroup)", async () => {
        // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
        const givenModelId = getMockStringId(1);

        // The parent (OccupationGroup)
        const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
        givenParentSpecs.code = "0"; // set the code to a single digit since this group should be a root node
        const givenParent = await repository.create(givenParentSpecs);

        // THE subject (OccupationGroup)
        const givenSubjectSpecs = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "subject", givenParent.code);
        const givenSubject = await repository.create(givenSubjectSpecs);

        // The child ISCOGroup
        const givenChildSpecs_1 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_1", givenSubject.code);
        const givenChild_1 = await repository.create(givenChildSpecs_1);

        // The child LocalGroup
        const givenChildSpecs_2 = getSimpleNewLocalGroupSpecWithParentCode(givenModelId, "child_2", givenSubject.code);
        const givenChild_2 = await repository.create(givenChildSpecs_2);

        // AND the subject OccupationGroup has a parent and two children
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
            childType: ObjectTypes.LocalGroup,
            childId: givenChild_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(3);

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
            expectedOccupationGroupReference(givenChild_2),
          ])
        );

        // AND expect the populate query plan to use the correct indexes
        expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
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

      test("should return the LocalGroup with its parent(LocalGroup) and children Groups(LocalGroups)", async () => {
        // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
        const givenModelId = getMockStringId(1);

        // The parent (LocalGroup)
        const givenParentSpecs = getSimpleNewLocalGroupSpec(givenModelId, "parent");
        const givenParent = await repository.create(givenParentSpecs);

        // THE subject (OccupationGroup)
        const givenSubjectSpecs = getSimpleNewLocalGroupSpecWithParentCode(givenModelId, "subject", givenParent.code);
        const givenSubject = await repository.create(givenSubjectSpecs);

        // The 1st child (LocalGroup)
        const givenChildSpecs_1 = getSimpleNewLocalGroupSpecWithParentCode(givenModelId, "child_1", givenSubject.code);
        const givenChild_1 = await repository.create(givenChildSpecs_1);

        // The 2nd child (LocalGroup)
        const givenChildSpecs_2 = getSimpleNewLocalGroupSpecWithParentCode(givenModelId, "child_2", givenSubject.code);
        const givenChild_2 = await repository.create(givenChildSpecs_2);

        // AND the subject OccupationGroup has a parent and two children
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenParent.id,
            childType: ObjectTypes.LocalGroup,
            childId: givenSubject.id,
          },
          {
            // child 1 of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalGroup,
            childId: givenChild_1.id,
          },
          {
            // child 2 of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalGroup,
            childId: givenChild_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(3);

        // WHEN searching for the subject by its id

        // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
        const actualPlans = setUpPopulateWithExplain<IOccupationGroupDoc>(repository.Model);
        const actualFoundOccupationGroup = (await repository.findById(givenSubject.id)) as IOccupationGroup;

        // THEN expect the OccupationGroup to be found
        expect(actualFoundOccupationGroup).not.toBeNull();

        // AND to have the given parent
        expect(actualFoundOccupationGroup.parent).toEqual(expectedOccupationGroupReference(givenParent));
        // AND to have the given children
        expect(actualFoundOccupationGroup.children).toEqual(
          expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
            expectedOccupationGroupReference(givenChild_1),
            expectedOccupationGroupReference(givenChild_2),
          ])
        );

        // AND expect the populate query plan to use the correct indexes
        expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
        expect(actualPlans).toEqual(
          expect.arrayContaining([
            // populating the parent hierarchy
            getExpectedPlan({
              collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
              filter: {
                modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
                childType: { $eq: ObjectTypes.LocalGroup },
                childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
              },
              usedIndex: INDEX_FOR_PARENT,
            }),
            // populating the child hierarchy
            getExpectedPlan({
              collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
              filter: {
                modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
                parentType: { $eq: ObjectTypes.LocalGroup },
                parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
              },
              usedIndex: INDEX_FOR_CHILDREN,
            }),
          ])
        );

        // AND expect no error to be logged
        expect(console.error).toBeCalledTimes(0);
      });

      test("should return the LocalGroup with its parent(LocalGroup) and children Occupations(LocalOccupations)", async () => {
        // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
        const givenModelId = getMockStringId(1);

        // The parent (LocalGroup)
        const givenParentSpecs = getSimpleNewLocalGroupSpec(givenModelId, "parent");
        const givenParent = await repository.create(givenParentSpecs);

        // THE subject (OccupationGroup)
        const givenSubjectSpecs = getSimpleNewLocalGroupSpecWithParentCode(givenModelId, "subject", givenParent.code);
        const givenSubject = await repository.create(givenSubjectSpecs);

        // The 1st child (LocalOccupation)
        const givenChildSpecs_1 = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "child_1",
          givenSubject.code
        );
        const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);

        // The 2nd child (LocalOccupation)
        const givenChildSpecs_2 = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "child_2",
          givenSubject.code
        );
        const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

        // AND the subject OccupationGroup has a parent and two children
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenParent.id,
            childType: ObjectTypes.LocalGroup,
            childId: givenSubject.id,
          },
          {
            // child 1 of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalOccupation,
            childId: givenChild_1.id,
          },
          {
            // child 2 of the subject
            parentType: ObjectTypes.LocalGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalOccupation,
            childId: givenChild_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(3);

        // WHEN searching for the subject by its id

        // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
        const actualPlans = setUpPopulateWithExplain<IOccupationGroupDoc>(repository.Model);
        const actualFoundOccupationGroup = (await repository.findById(givenSubject.id)) as IOccupationGroup;

        // THEN expect the OccupationGroup to be found
        expect(actualFoundOccupationGroup).not.toBeNull();

        // AND to have the given parent
        expect(actualFoundOccupationGroup.parent).toEqual(expectedOccupationGroupReference(givenParent));
        // AND to have the given children
        expect(actualFoundOccupationGroup.children).toEqual(
          expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
            expectedOccupationReference(givenChild_1),
            expectedOccupationReference(givenChild_2),
          ])
        );

        // AND expect the populate query plan to use the correct indexes
        expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
        expect(actualPlans).toEqual(
          expect.arrayContaining([
            // populating the parent hierarchy
            getExpectedPlan({
              collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
              filter: {
                modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
                childType: { $eq: ObjectTypes.LocalGroup },
                childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
              },
              usedIndex: INDEX_FOR_PARENT,
            }),
            // populating the child hierarchy
            getExpectedPlan({
              collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
              filter: {
                modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
                parentType: { $eq: ObjectTypes.LocalGroup },
                parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
              },
              usedIndex: INDEX_FOR_CHILDREN,
            }),
          ])
        );

        // AND expect no error to be logged
        expect(console.error).toBeCalledTimes(0);
      });
    });

    describe.each<[string, ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup]>([
      ["ISCOGroup", ObjectTypes.ISCOGroup],
      ["LocalGroup", ObjectTypes.LocalGroup],
    ])("Test OccupationGroup hierarchy robustness to inconsistencies for %s", (_description, givenGroupType) => {
      test("should ignore parents that are not OccupationGroups (ISCOGroup, LocalGroup)", async () => {
        // GIVEN an inconsistency was introduced, and non-OccupationGroup document is a parent of an OccupationGroup
        const givenModelId = getMockStringId(1);
        // The OccupationGroup
        const givenOccupationGroupSpecs = getSimpleNewOccupationGroupSpec(givenGroupType, givenModelId, "group_1");
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
          childType: givenGroupType,
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
        const givenOccupationGroupSpecs = getNewOccupationGroupSpec(givenGroupType);
        const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);
        // The non-OccupationGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupationGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup.id),
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: givenGroupType,

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
        const givenOccupationGroupSpecs_1 = getNewOccupationGroupSpec(givenGroupType);
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenOccupationGroupSpecs_2 = getNewOccupationGroupSpec(givenGroupType);
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: givenGroupType,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.OccupationGroup,
          childType: givenGroupType,
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
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenGroupType, givenModelId_1, "group_1");
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenOccupationGroupSpecs_2 = getNewOccupationGroupSpec(givenGroupType);
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id),
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: givenGroupType,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.OccupationGroup,
          childType: givenGroupType,
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
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(givenGroupType, givenModelId_1, "group_1");
        const givenOccupationGroup_1 = await repository.create(givenOccupationGroupSpecs_1);
        // The OccupationGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationGroupSpecs_2 = getNewOccupationGroupSpec(givenGroupType);
        const givenOccupationGroup_2 = await repository.create(givenOccupationGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenOccupationGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.OccupationGroup,
          parentType: givenGroupType,

          childId: new mongoose.Types.ObjectId(givenOccupationGroup_2.id),
          childDocModel: MongooseModelName.OccupationGroup,
          childType: givenGroupType,
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
        const givenSubjectSpecs = getSimpleNewOccupationGroupSpec(givenGroupType, givenModelId, "subject", true);
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
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpecWithParentCode(
          givenModelId,
          "occupation_2",
          givenOccupation_1.code
        );
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // AND a third occupation_3 with some ID in the given model
        const givenOccupationSpecs_3 = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "occupation_3",
          givenSubject.code
        );
        const givenOccupation_3 = await repositoryRegistry.occupation.create(givenOccupationSpecs_3);

        // AND the occupation occupation_1  is the parent of occupation_2
        // AND the subject OccupationGroup  is the parent of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: givenGroupType,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalOccupation,
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
        const givenID = new mongoose.Types.ObjectId(2);

        // AND an occupationGroup with some ID in the given model
        const givenOccupationGroupSpecs_1 = getSimpleNewOccupationGroupSpec(
          givenGroupType,
          givenModelId,
          "isco_1",
          true
        );
        const givenOccupationGroup_1 = await repositoryRegistry.OccupationGroup.create(givenOccupationGroupSpecs_1);

        // AND an Occupation givenOccupation_1 with a given ID in the given model
        const givenOccupation1Specs = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "Occupation_1",
          givenOccupationGroup_1.code
        );
        // @ts-ignore
        givenOccupation1Specs.id = givenID.toHexString();
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupation1Specs);
        // guard to ensure the id is the given one
        expect(givenOccupation_1.id).toEqual(givenID.toHexString());

        // AND a second occupationGroup with some ID  in the given model
        const givenOccupationGroupSpecs_2 = getSimpleNewOccupationGroupSpec(givenGroupType, givenModelId, "isco_2");
        const givenOccupationGroup_2 = await repositoryRegistry.OccupationGroup.create(givenOccupationGroupSpecs_2);

        // AND a subject Occupation group with the givenId
        const givenSubjectSpecs = getSimpleNewOccupationGroupSpecWithParentCode(
          givenGroupType,
          givenModelId,
          "subject",
          givenOccupationGroup_2.code
        );
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND the occupation occupation_1  is the child of occupationGroup_2
        // AND the subject OccupationGroup  is the child of Occupation_3
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: givenOccupationGroup_1.groupType,
            parentId: givenOccupationGroup_1.id,
            childType: givenOccupation_1.occupationType,
            childId: givenOccupation_1.id,
          },
          {
            parentType: givenOccupationGroup_2.groupType,
            parentId: givenOccupationGroup_2.id,
            childType: givenSubject.groupType,
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

  describe("Test findParent()", () => {
    test("should find an OccupationGroup parent by childId", async () => {
      // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
      const givenModelId = getMockStringId(1);

      // The root parent (OccupationGroup)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);
      // The 2nd level parent (OccupationGroup)
      const givenParentSpecs_2 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "parent_2", givenParent.code);
      const givenParent_2 = await repository.create(givenParentSpecs_2);
      // The 3rd level parent (OccupationGroup)
      const givenParentSpecs_3 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "parent_3", givenParent_2.code);
      const givenParent_3 = await repository.create(givenParentSpecs_3);

      // THE subject (OccupationGroup)
      const givenSubjectSpecs = getSimpleNewISCOGroupSpecWithParentCode(
        givenModelId,
        "subject",
        givenParent_3.code,
        true
      );
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The child ESCO Occupation
      const givenChildSpecs_1 = getSimpleNewESCOOccupationSpecWithParentCode(
        givenModelId,
        "child_2",
        givenSubject.code
      );
      const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);
      // AND the subject OccupationGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent_3.id,
          childType: ObjectTypes.ISCOGroup,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.ESCOOccupation,
          childId: givenChild_1.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(2);

      const actualFoundParent = await repository.findParent(givenSubject.id);

      // THEN expect the OccupationGroup to be found

      // AND to be the direct parent of the subject
      expect(actualFoundParent).toEqual({
        ...givenParent_3,
        children: [
          {
            UUID: givenSubject.UUID,
            id: givenSubject.id,
            code: givenSubject.code,
            objectType: givenSubject.groupType,
            preferredLabel: givenSubject.preferredLabel,
          },
        ],
      });
    });
    test("should return null if no parent for the given OccupationGroup with the given child id", async () => {
      // GIVEN an OccupationGroup exists without a parent
      const givenModelId = getMockStringId(1);
      const givenOccupationGroupSpecs = getSimpleNewISCOGroupSpec(givenModelId, "group_1");
      const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);

      // WHEN searching for its parent by its id
      const actualFoundParent = await repository.findParent(givenOccupationGroup.id);

      // THEN expect no parent to be found
      expect(actualFoundParent).toBeNull();
    });
    test("should return null if the child given id is not a valid object id", async () => {
      // GIVEN No OccupationGroup exists in the database
      // WHEN searching for the OccupationGroup parent by it's child id
      const actualFoundOccupationGroupParent = await repository.findParent("non_existing_child_id");

      // THEN expect no OccupationGroup parent to be found
      expect(actualFoundOccupationGroupParent).toBeNull();
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.OccupationGroup.findParent(getMockStringId(1));
    });
  });

  describe("Test findChildren()", () => {
    test("should find an OccupationGroup | Occupation children by parentId", async () => {
      // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
      const givenModelId = getMockStringId(1);

      // The root parent (OccupationGroup)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);
      // The 2nd level parent (OccupationGroup)
      const givenChildSpec_1 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_1", givenParent.code);
      const givenChild_1 = await repository.create(givenChildSpec_1);
      // The 3rd level parent (OccupationGroup)
      const givenChildSpecs_2 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_2", givenParent.code);
      const givenChild_2 = await repository.create(givenChildSpecs_2);

      // THE subject (OccupationGroup)
      const givenChildSpecs_3 = getSimpleNewISCOGroupSpecWithParentCode(
        givenModelId,
        "child_3",
        givenParent.code,
        true
      );
      const givenChild_3 = await repository.create(givenChildSpecs_3);

      // The child ESCO Occupation
      const givenChildSpecs_4 = getSimpleNewESCOOccupationSpecWithParentCode(
        givenModelId,
        "child_4",
        givenChild_3.code
      );
      const givenChild_4 = await repositoryRegistry.occupation.create(givenChildSpecs_4);
      // AND the subject OccupationGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.ISCOGroup,
          childId: givenChild_1.id,
        },
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.ISCOGroup,
          childId: givenChild_2.id,
        },

        {
          // child 1 of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenChild_3.id,
          childType: ObjectTypes.ESCOOccupation,
          childId: givenChild_4.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);
      const actualFoundChildren = await repository.findChildren(givenParent.id);

      const expectedChildren = [
        {
          id: givenChild_1.id,
          parentId: givenParent.id,
          UUID: givenChild_1.UUID,
          UUIDHistory: givenChild_1.UUIDHistory,
          originUri: givenChild_1.originUri,
          code: givenChild_1.code,
          description: givenChild_1.description,
          preferredLabel: givenChild_1.preferredLabel,
          altLabels: givenChild_1.altLabels,
          objectType: givenChild_1.groupType,
          modelId: givenChild_1.modelId,
          createdAt: givenChild_1.createdAt,
          updatedAt: givenChild_1.updatedAt,
        },
        {
          id: givenChild_2.id,
          parentId: givenParent.id,
          UUID: givenChild_2.UUID,
          UUIDHistory: givenChild_2.UUIDHistory,
          originUri: givenChild_2.originUri,
          code: givenChild_2.code,
          description: givenChild_2.description,
          preferredLabel: givenChild_2.preferredLabel,
          altLabels: givenChild_2.altLabels,
          objectType: givenChild_2.groupType,
          modelId: givenChild_2.modelId,
          createdAt: givenChild_2.createdAt,
          updatedAt: givenChild_2.updatedAt,
        },
      ];
      // THEN expect the children to be found
      expect(actualFoundChildren).toHaveLength(2);
      expect(actualFoundChildren).toEqual(expectedChildren);
    });
    test("should return [] if no children for the given OccupationGroup with the given parent id", async () => {
      // GIVEN an OccupationGroup exists without a parent
      const givenModelId = getMockStringId(1);
      const givenOccupationGroupSpecs = getSimpleNewISCOGroupSpec(givenModelId, "group_1");
      const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);

      // WHEN searching for its parent by its id
      const actualFoundChildren = await repository.findChildren(givenOccupationGroup.id);

      // THEN expect no parent to be found
      expect(actualFoundChildren).toEqual([]);
    });
    test("should return [] if the parent given id is not a valid object id", async () => {
      // GIVEN No OccupationGroup exists in the database
      // WHEN searching for the OccupationGroup children by it's id
      const actualFoundOccupationGroupChildren = await repository.findChildren("non_existing_parent_id");

      // THEN expect no OccupationGroup children to be found
      expect(actualFoundOccupationGroupChildren).toEqual([]);
    });
    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.OccupationGroup.findChildren(getMockStringId(1));
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
      expect(actualOccupationGroupsArray).toIncludeSameMembers(expectedOccupationGroups);
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

  describe("Test findPaginated()", () => {
    test("should return first page when cursor is undefined", async () => {
      // GIVEN a modelId to group the occupationGroups together
      const givenModelId = getMockStringId(1);
      const givenOccupationGroups: IOccupationGroup[] = [];
      for (let i = 0; i < 3; i++) {
        const givenOccupationGroupSpecs = getSimpleNewLocalGroupSpec(givenModelId, `group_${i + 1}`);
        const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);
        givenOccupationGroups.push(givenOccupationGroup);
      }

      // WHEN retrieving the first page with undefined cursor and a limit of 2 (default desc order)
      const firstPage = await repository.findPaginated(givenModelId, 2, -1);
      const actualFirstPage = firstPage;

      // THEN expect the latest 2 documents by _id (desc)
      const expectedFirstPage = givenOccupationGroups
        .slice(-2)
        .map(({ parent, children, ...rest }) => ({ ...rest, parent: null, children: [] }))
        .reverse();
      expect(actualFirstPage).toHaveLength(2);
      expect(actualFirstPage).toEqual(expectedFirstPage);
    });

    test("should return paginated OccupationGroups for a given modelId, limit and cursor", async () => {
      // GIVEN a modelId to group the occupationGroups together
      const givenModelId = getMockStringId(1);
      const givenOccupationGroups = [];
      for (let i = 0; i < 3; i++) {
        const givenOccupationGroupSpecs = getSimpleNewLocalGroupSpec(givenModelId, `group_${i + 1}`);
        const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);
        givenOccupationGroups.push(givenOccupationGroup);
      }
      // WHEN retrieving the occupationGroups with a cursor pointing to group_3 (newest) and a limit of 2
      const firstPage = await repository.findPaginated(givenModelId, 2, -1);
      const actualFirstPageOccupationGroupsArray = firstPage;

      // THEN the first page should contain group_2 and group_1 (items older than group_3) ordered by _id descending
      const expectedOccupationGroups = givenOccupationGroups
        .slice(1, 3)
        .map(({ parent, children, ...rest }) => ({ ...rest, parent: null, children: [] }))
        .reverse();
      expect(actualFirstPageOccupationGroupsArray).toHaveLength(2);
      const expectedFirstPageOccupationGroups = expectedOccupationGroups; // [group_2, group_1]
      expect(actualFirstPageOccupationGroupsArray).toHaveLength(2);
      expect(actualFirstPageOccupationGroupsArray).toEqual(expectedFirstPageOccupationGroups);
    });
    test("should handle errors during paginated data retrieval", async () => {
      // GIVEN that an error will occur when retrieving data
      const givenError = new Error("foo");
      jest.spyOn(repository.Model, "aggregate").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN finding paginated occupationGroups for some modelId
      // THEN expect the operation to fail with the given error
      await expect(repository.findPaginated(getMockStringId(1), 2, -1)).rejects.toThrowError(
        new Error("OccupationGroupRepository.findPaginated: findPaginated failed", { cause: givenError })
      );
    });
    test("should reject when database query fails", async () => {
      const givenError = new Error("database query failure");

      const aggregateSpy = jest.spyOn(repository.Model, "aggregate").mockReturnValue({
        exec: jest.fn().mockRejectedValue(givenError),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(repository.findPaginated(getMockStringId(1), 1, -1)).rejects.toThrow(
        new Error("OccupationGroupRepository.findPaginated: findPaginated failed", { cause: givenError })
      );

      aggregateSpy.mockRestore();
    });

    test("should paginate consistently across mixed limits and cursor flow", async () => {
      // GIVEN a modelId and three occupation groups created in order
      const givenModelId = getMockStringId(1);
      const given_occupation_group1 = await repository.create(getSimpleNewLocalGroupSpec(givenModelId, "g1"));
      const given_occupation_group2 = await repository.create(getSimpleNewLocalGroupSpec(givenModelId, "g2"));
      const given_occupation_group3 = await repository.create(getSimpleNewLocalGroupSpec(givenModelId, "g3"));

      // WHEN requesting first page with limit=3 and no cursor (desc by _id => newest first)
      const page2 = await repository.findPaginated(givenModelId, 3, -1);
      // THEN expect when fetching three items with limit=3, to get all three items in the correct order
      expect(page2).toHaveLength(3);
      const firstTwoIds = page2.map((i) => i.id);
      expect(firstTwoIds).toEqual([given_occupation_group3.id, given_occupation_group2.id, given_occupation_group1.id]);

      // WHEN requesting first page with limit=1 and no cursor
      const page1 = await repository.findPaginated(givenModelId, 1, -1);
      expect(page1).toHaveLength(1);
      expect(page1[0].id).toBe(given_occupation_group3.id);
    });

    test("should warn and ignore invalid cursor", async () => {
      // GIVEN a unique modelId and some occupation groups
      const givenModelId = getMockStringId(999); // Use a unique modelId to avoid conflicts
      const givenOccupationGroupSpecs = getSimpleNewLocalGroupSpec(givenModelId, "test_group");
      const createdGroup = await repository.create(givenOccupationGroupSpecs);

      // WHEN finding paginated occupationGroups with an invalid cursor
      const result = await repository.findPaginated(givenModelId, 2, -1);

      // AND expect the result to ignore the invalid cursor and return the first page
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(createdGroup.id);
    });

    test("should populate parent and children for items in paginated results", async () => {
      // GIVEN a modelId and a small hierarchy: parent -> subject -> child
      const givenModelId = getMockStringId(321);

      // Parent group
      const parent = await repository.create(getSimpleNewISCOGroupSpec(givenModelId, "parent"));
      // Subject group
      const subject = await repository.create(
        getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "subject", parent.code)
      );
      // Child group
      const child = await repository.create(
        getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child", subject.code)
      );

      // Build hierarchy relations explicitly
      const hierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.ISCOGroup,
          parentId: parent.id,
          childType: ObjectTypes.ISCOGroup,
          childId: subject.id,
        },
        {
          parentType: ObjectTypes.ISCOGroup,
          parentId: subject.id,
          childType: ObjectTypes.ISCOGroup,
          childId: child.id,
        },
      ]);
      expect(hierarchy).toHaveLength(2);

      // WHEN retrieving a page large enough to include all three
      const page = await repository.findPaginated(givenModelId, 10, -1);

      // THEN find the subject entry and assert it has populated parent and children
      const subjectFromPage = page.find((i) => i.id === subject.id)!;
      expect(subjectFromPage).toBeDefined();
      expect(subjectFromPage.parent).toEqual(expectedOccupationGroupReference(parent));
      expect(subjectFromPage.children).toEqual(
        expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
          expectedOccupationGroupReference(child),
        ])
      );
    });
  });

  describe("Test getOccupationGroupByUUID()", () => {
    test("Should return an existing occupationGroup by occupationGroup uuid", async () => {
      // GIVEN an OccupationGroup exists in the database
      const givenOccupationGroupSpecs = getSimpleNewLocalGroupSpec(getMockStringId(1), "group_2");
      const givenOccupationGroup = await repository.create(givenOccupationGroupSpecs);

      // WHEN search for the OccupationGroup by its uuid
      const actualFoundOccupationGroup = await repository.getOccupationGroupByUUID(givenOccupationGroup.UUID);

      //THEN expect the OccupationGroup to be found
      expect(actualFoundOccupationGroup).toEqual(givenOccupationGroup);
    });
    test("should return null if no OccupationGroup with the given uuid exists", async () => {
      // GIVEN no OccupationGroup exists in the database

      // WHEN searching for the OccupationGroup by it's uuid
      const actualFoundOccupationGroup = await repository.getOccupationGroupByUUID(randomUUID());

      // THEN expect no OccupationGroup to be found
      expect(actualFoundOccupationGroup).toBeNull();
    });
    test("should return null if given uuid is not a valid uuid", async () => {
      // GIVEN no OccupationGroup exists in the database

      // WHEN searching for the OccupationGroup by it's uuid
      const actualFoundOccupationGroup = await repository.getOccupationGroupByUUID("non_existing_uuid");

      // THEN expect no OccupationGroup to be found
      expect(actualFoundOccupationGroup).toBeNull();
    });

    describe("should return the OccupationGroup with it's parent and children", () => {
      test("should return the ISCOGroup with its parent(ISCOGroup) and children occupations(ESCOOccupations, LocalOccupations)", async () => {
        // GIVEN three OccupationGroups and one Occupation exists in the database in the same model
        const givenModelId = getMockStringId(1);

        // The root parent (OccupationGroup)
        const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
        const givenParent = await repository.create(givenParentSpecs);
        // The 2nd level parent (OccupationGroup)
        const givenParentSpecs_2 = getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "parent_2", givenParent.code);
        const givenParent_2 = await repository.create(givenParentSpecs_2);
        // The 3rd level parent (OccupationGroup)
        const givenParentSpecs_3 = getSimpleNewISCOGroupSpecWithParentCode(
          givenModelId,
          "parent_3",
          givenParent_2.code
        );
        const givenParent_3 = await repository.create(givenParentSpecs_3);

        // THE subject (OccupationGroup)
        const givenSubjectSpecs = getSimpleNewISCOGroupSpecWithParentCode(
          givenModelId,
          "subject",
          givenParent_3.code,
          true
        );
        const givenSubject = await repository.create(givenSubjectSpecs);

        // The child ESCO Occupation
        const givenChildSpecs_1 = getSimpleNewESCOOccupationSpecWithParentCode(
          givenModelId,
          "child_2",
          givenSubject.code
        );
        const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);

        // The child Local Occupation
        const givenChildSpecs_2 = getSimpleNewLocalOccupationSpecWithParentCode(
          givenModelId,
          "child_3",
          givenSubject.code
        );
        const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

        // AND the subject OccupationGroup has a parent and two children
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            // parent of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenParent_3.id,
            childType: ObjectTypes.ISCOGroup,
            childId: givenSubject.id,
          },
          {
            // child 1 of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.ESCOOccupation,
            childId: givenChild_1.id,
          },
          {
            // child 2 of the subject
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.LocalOccupation,
            childId: givenChild_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(3);

        // WHEN searching for the subject by its uuid

        const actualPlans = setUpPopulateWithExplain<IOccupationGroupDoc>(repository.Model);
        const actualFoundOccupationGroup = (await repository.getOccupationGroupByUUID(
          givenSubject.UUID
        )) as IOccupationGroup;

        // THEN expect the OccupationGroup to be found
        expect(actualFoundOccupationGroup).not.toBeNull();

        // AND to have the given parent
        expect(actualFoundOccupationGroup.parent).toEqual(expectedOccupationGroupReference(givenParent_3));
        // AND to have the given children
        expect(actualFoundOccupationGroup.children).toEqual(
          expect.arrayContaining<IOccupationGroupReference | IOccupationReference>([
            expectedOccupationReference(givenChild_1),
            expectedOccupationReference(givenChild_2),
          ])
        );

        // AND expect the populate query plan to use the correct indexes
        expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
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
      TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
        return repositoryRegistry.OccupationGroup.getOccupationGroupByUUID(getMockStringId(1));
      });
    });

    describe("Test getHistory()", () => {
      test("should return the detailed UUIDHistory of an OccupationGroup", async () => {
        const givenValidModelId = getMockStringId(1);
        //GIVEN an OccupationGroup in the database
        const givenExistingOccupationGroupSpecs = getSimpleNewISCOGroupSpec(givenValidModelId, "group_1");
        const givenExistingOccupationGroup = await repository.create(givenExistingOccupationGroupSpecs);

        // AND a target OccupationGroup with the given OccupationGroup in it's uuid history
        const givenTargetOccupationGroupSpecs = getSimpleNewISCOGroupSpec(givenValidModelId, "group_2");
        const givenTargetOccupationGroup = await repository.create(givenTargetOccupationGroupSpecs);
        // AND the target has its own UUID in it's UUIDHistory
        // AND the target has the given occupationGroup in it's UUIDHistory
        // AND the target occupationGroup has a random UUID in it's UUIDHistory
        // AND the target occupationGroup has a uuid that is not the current UUID of the occupationGroup even if it exists in it's history array
        givenTargetOccupationGroup.UUIDHistory = [
          givenTargetOccupationGroup.UUID,
          givenExistingOccupationGroup.UUID,
          randomUUID(),
          givenExistingOccupationGroup.UUIDHistory.at(-1)!,
        ];

        // WHEN we retrieve the UUIDHistory of the occupationGroup
        const actualUUIDHistory = await repository.getHistory(givenTargetOccupationGroup.UUIDHistory);

        // THEN expect the UUIDHistory to have the details for the target OccupationGroup and the given OccupationGroup
        const expectedUUIDHistory = [
          // the UUID of the target itself occupationGroup
          {
            id: givenTargetOccupationGroup.id,
            UUID: givenTargetOccupationGroup.UUID,
            preferredLabel: givenTargetOccupationGroup.preferredLabel,
            code: givenTargetOccupationGroup.code,
            objectType: givenTargetOccupationGroup.groupType,
          },
          // the UUID of the given occupationGroup
          {
            id: givenExistingOccupationGroup.id,
            UUID: givenExistingOccupationGroup.UUID,
            preferredLabel: givenExistingOccupationGroup.preferredLabel,
            code: givenExistingOccupationGroup.code,
            objectType: givenExistingOccupationGroup.groupType,
          },
          // AND the randomUUID
          {
            id: null,
            UUID: givenTargetOccupationGroup.UUIDHistory[2],
            preferredLabel: null,
            code: null,
            objectType: null,
          },
          // AND the last UUID in the history of the given model
          {
            id: null,
            UUID: givenExistingOccupationGroup.UUIDHistory.at(-1),
            preferredLabel: null,
            code: null,
            objectType: null,
          },
        ];

        expect(actualUUIDHistory).toEqual(expectedUUIDHistory);
      });
      TestDBConnectionFailureNoSetup((repository) => {
        return repository.OccupationGroup.getHistory([randomUUID()]);
      });
    });
  });
});
