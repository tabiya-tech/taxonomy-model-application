// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import mongoose, {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {generateRandomUrl, getRandomString, getTestString} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {IISCOGroupRepository} from "./ISCOGroupRepository";
import {
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH
} from "esco/common/modelSchema";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {getMockRandomISCOGroupCode} from "_test_utilities/mockISCOCode";
import {IISCOGroup, INewISCOGroupSpec} from "./ISCOGroup.types";
import {
  IOccupationHierarchyPairDoc
} from "esco/occupationHierarchy/occupationHierarchy.types";
import {ObjectTypes} from "esco/common/objectTypes";
import {MongooseModelName} from "esco/common/mongooseModelNames";
import {INewSkillSpec} from "esco/skill/skills.types";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

/**
 * Helper function to create an INewISCOGroupSpec with random values,
 * that can be used for creating a new ISCOGroup
 */
function getNewISCOGroupSpec(): INewISCOGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: "",
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH)
  };
}

function getSimpleNewISCOGroupSpec(modelId: string, preferredLabel: string): INewISCOGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: "",
    importId: ""
  };
}

/**
 * Helper function to create an expected ISCOGroup from a given INewISCOGroupSpec,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewISCOGroupSpec): IISCOGroup {
  return {
    ...givenSpec,
    id: expect.any(String),
    parent: null,
    children: [],
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the ISCOGroup Repository with an in-memory mongodb", () => {


  beforeEach(() => {
    jest.clearAllMocks();
  })

  let dbConnection: Connection;
  let repository: IISCOGroupRepository;
  let repositoryRegistry: RepositoryRegistry;


  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ISCOGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry()
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

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
      await repositoryRegistry.occupationHierarchy.hierarchyModel.deleteMany({}).exec();
    }
  }

  afterEach(async () => {
    await cleanupDBCollections();
  })

  beforeEach(async () => {
    await cleanupDBCollections();
  })

  test("should return the model", async () => {
    expect(repository.Model).toBeDefined();
  });

  test("initOnce has registered the ISCOGroupRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce()

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().ISCOGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() ISCOGroup ", () => {

    test("should successfully create a new ISCOGroup", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCOGroup with given specifications
      const actualNewISCOGroup: INewISCOGroupSpec = await repository.create(givenNewISCOGroupSpec);

      // THEN expect the new ISCOGroup to be created with the specific attributes
      const expectedNewISCO: IISCOGroup = expectedFromGivenSpec(givenNewISCOGroupSpec);
      expect(actualNewISCOGroup).toEqual(expectedNewISCO);
    });
    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCOGroup with a provided UUID
      const actualNewISCOGroupPromise = repository.create({
        ...givenNewISCOGroupSpec,
        //@ts-ignore
        UUID: randomUUID()
      })

      // Then expect the promise to reject with an error
      await expect(actualNewISCOGroupPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a ISCOGroup record exists in the database
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenNewISCOGroup = await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating a new ISCOGroup with the same UUID as the one the existing ISCOGroup
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewISCOGroup.UUID);
        const actualSecondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const actualSecondNewISCOGroupPromise = repository.create(actualSecondNewISCOGroupSpec);

        // Then expect the promise to reject with an error
        await expect(actualSecondNewISCOGroupPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
      });

      test("should successfully create a second Identical ISCOGroup in a different model", async () => {
        // GIVEN a ISCOGroup record exists in the database for a given model
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating an identical ISCOGroup in a new model (new modelId)
        // @ts-ignore
        const actualSecondNewISCOGroupSpec: INewISCOGroupSpec = {...givenNewISCOGroupSpec};
        actualSecondNewISCOGroupSpec.modelId = getMockId(3);
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
        await expect(actualSecondNewModelPromise).rejects.toThrowError(/duplicate key error collection/);
      });
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewISCOGroupSpec());
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
      const actualNewISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);

      // THEN expect all the ISCOGroups to be created with the specific attributes
      expect(actualNewISCOGroups).toEqual(
        expect.arrayContaining(
          givenNewISCOGroupSpecs.map((givenNewISCOGroupSpec) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new ISCOGroups even if some don't validate", async () => {
      // GIVEN two valid ISCOGroupSpec
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [getNewISCOGroupSpec(), getNewISCOGroupSpec()];
      // AND two ISCOGroupSpec that is invalid
      const givenInvalidISCOGroupSpec: INewISCOGroupSpec [] = [getNewISCOGroupSpec(), getNewISCOGroupSpec()];
      givenInvalidISCOGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidISCOGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewISCOGroups: INewISCOGroupSpec[] = await repository.createMany([
        givenValidISCOGroupSpecs[0],
        ...givenInvalidISCOGroupSpec,
        givenValidISCOGroupSpecs[1],
      ]);

      // THEN expect only the valid ISCOGroup to be created
      expect(actualNewISCOGroups).toHaveLength(givenValidISCOGroupSpecs.length);
      expect(actualNewISCOGroups).toEqual(
        expect.arrayContaining(
          givenValidISCOGroupSpecs.map((givenNewISCOGroupSpec) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec);
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
        const actualNewISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewISCOGroups).toEqual(
          expect.arrayContaining(
            givenNewISCOGroupSpecs.filter((spec, index) => index !== 1)
              .map((givenNewISCOGroupSpec) => {
                return expectedFromGivenSpec(givenNewISCOGroupSpec);
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
        const actualNewISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewISCOGroups).toEqual(
          expect.arrayContaining(
            givenNewISCOGroupSpecs.filter((spec, index) => index !== 1)
              .map((givenNewISCOGroupSpec) => {
                return expectedFromGivenSpec(givenNewISCOGroupSpec);
              })
          )
        );
      });
    });

    // Testing connection failure with the insetMany() is currently not possible,
    // as there no easy way to simulate a connection failure.
    // Force closing the connection will throw an uncaught exception instead of the operation rejecting.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // Other ways of simulating the connection failure e.g, start/stopping the in memory mongo instance,
    // will cause the test to wait for quite some time, as there is no way to set a maxTime of the insertMany() operation.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // TestConnectionFailure((repository) => {
    //    return repository.createMany([getNewISCOGroupSpec()]);
    //  });
  });

  describe("Test findById()", () => {

    test("should find an ISCOGroup by its id", async () => {
      // GIVEN an ISCOGroup exists in the database
      const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
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

    describe("Test ISCOGroup hierarchy robustness to inconsistencies", () => {

      test("should ignore parents that are not ISCOGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a parent of an ISCOGroup
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenISCOGroup.modelId,
          originUUID: "",
          ESCOUri: "",
          definition: "",
          description: "",
          scopeNote: "",
          skillType: "knowledge",
          reuseLevel: "cross-sector",
          altLabels: [],
          importId: "",
        };
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
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCOGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parent).toEqual(null);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not an ISCOGroup: ${givenInconsistentPair.parentDocModel}`);

      });

      test("should ignore children that are not ISCO Groups | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a child of an ISCOGroup
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenISCOGroup.modelId,
          originUUID: "",
          ESCOUri: "",
          definition: "",
          description: "",
          scopeNote: "",
          skillType: "knowledge",
          reuseLevel: "cross-sector",
          altLabels: [],
          importId: "",
        };
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
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCOGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not an ISCOGroup or Occupation: ${givenInconsistentPair.childDocModel}`);
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The ISCOGroup 1
        const givenModelId_1 = getMockId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockId(2);
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId_2, "group_2");
        const givenISCOGroup_2 = await repository.create(givenISCOGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        }
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
        const givenModelId_1 = getMockId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockId(2);
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
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCO Group_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_1 = await repository.findById(givenISCOGroup_1.id);

        // THEN expect the ISCOGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The ISCOGroup 1
        const givenModelId_1 = getMockId(1);
        const givenISCOGroupSpecs_1 = getSimpleNewISCOGroupSpec(givenModelId_1, "group_1");
        const givenISCOGroup_1 = await repository.create(givenISCOGroupSpecs_1);
        // The ISCOGroup 2
        const givenModelId_2 = getMockId(2);
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
        }

        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the ISCO Group_2 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenISCOGroup_2.id);

        // THEN expect the ISCOGroup to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });
    })
  })
});

function TestConnectionFailure(actionCallback: (repository: IISCOGroupRepository) => Promise<any>) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const givenConfig = getTestConfiguration("ISCOGroupRepositoryTestDB");
    const givenConnection = await getNewConnection(givenConfig.dbURI);
    const givenRepositoryRegistry = new RepositoryRegistry();
    await givenRepositoryRegistry.initialize(givenConnection);
    const givenRepository = givenRepositoryRegistry.ISCOGroup;

    // WHEN connection is lost
    await givenConnection.close(false);

    // THEN expect to reject with an error
    await expect(actionCallback(givenRepository)).rejects.toThrowError(/Client must be connected before running operations/);
  });
}