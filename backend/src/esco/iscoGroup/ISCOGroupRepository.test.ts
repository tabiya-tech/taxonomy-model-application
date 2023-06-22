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
import {DESCRIPTION_MAX_LENGTH, LABEL_MAX_LENGTH} from "esco/common/modelSchema";
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
    description: getTestString(DESCRIPTION_MAX_LENGTH)
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
    description: ""
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

      // WHEN Creating a new ISCO Group with given specifications
      const newISCOGroup: INewISCOGroupSpec = await repository.create(givenNewISCOGroupSpec);

      // THEN expect the new ISCO Group to be created with the specific attributes
      const expectedNewISCO: IISCOGroup = expectedFromGivenSpec(givenNewISCOGroupSpec);
      expect(newISCOGroup).toEqual(expectedNewISCO);
    });
    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a ISCOGroupSpec that is otherwise valid but has a UUID
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCOGroup with a provided UUID
      const newISCOGroupPromise = repository.create({
        ...givenNewISCOGroupSpec,
        //@ts-ignore
        UUID: randomUUID()
      })

      // Then expect the promise to reject with an error
      await expect(newISCOGroupPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a ISCOGroup record exists in the database
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenNewISCOGroup = await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating a new ISCOGroup with the same UUID as the one the existing ISCOGroup
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewISCOGroup.UUID);
        const secondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const secondNewISCOGroupPromise = repository.create(secondNewISCOGroupSpec);

        await expect(secondNewISCOGroupPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
      });

      test("should successfully create a second Identical ISCOGroup in a different model", async () => {
        // GIVEN a ISCOGroup record exists in the database for a given model
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating an identical ISCOGroup in a new model (new modelId)
        // @ts-ignore
        const secondNewISCOGroupSpec: INewISCOGroupSpec = {...givenNewISCOGroupSpec};
        secondNewISCOGroupSpec.modelId = getMockId(3);
        const secondNewISCOGroupPromise = repository.create(secondNewISCOGroupSpec);

        // THEN expect the new ISCOGroup to be created
        await expect(secondNewISCOGroupPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
        // GIVEN a ISCOGroup record exists in the database
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenNewModel = await repository.create(givenNewISCOGroupSpec);

        // WHEN Creating a new ISCOGroup with the same pair of modelId and code as the ones the existing ISCOGroup
        // @ts-ignore
        const secondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        secondNewISCOGroupSpec.code = givenNewModel.code;
        secondNewISCOGroupSpec.modelId = givenNewModel.modelId;
        const secondNewModelPromise = repository.create(secondNewISCOGroupSpec);

        await expect(secondNewModelPromise).rejects.toThrowError(/duplicate key error collection/);
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

      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);

      // THEN expect all the ISCO Groups to be created with the specific attributes
      expect(newISCOGroups).toEqual(
        expect.arrayContaining(
          givenNewISCOGroupSpecs.map((givenNewISCOGroupSpec) => {
            return expectedFromGivenSpec(givenNewISCOGroupSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new ISCOGroups even if some don't validate", async () => {
      // GIVEN some valid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidISCOGroupSpecs[i] = getNewISCOGroupSpec();
      }
      // AND one ISCOGroupSpec that is invalid
      const givenInvalidISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      givenInvalidISCOGroupSpec.code = "invalid code";

      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.createMany([...givenValidISCOGroupSpecs, givenInvalidISCOGroupSpec]);

      // THEN expect only the valid ISCO Group to be created
      expect(newISCOGroups).toHaveLength(givenValidISCOGroupSpecs.length);

      expect(newISCOGroups).toEqual(
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
      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenValidISCOGroupSpecs);

      // THEN expect an empty array to be created
      expect(newISCOGroups).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 ISCOGroupSpec
        const givenBatchSize = 3;
        const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
        }

        // WHEN batch creating the ISCO Groups with the given specifications
        // AND the second ISCOGroupSpec is created with the same UUID as the first one
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");

        const newISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);

        // THEN expect only the first and the third the ISCO Groups to be created with the specific attributes
        expect(newISCOGroups).toEqual(
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

        // WHEN batch creating the ISCO Groups with the given specifications
        // AND the second ISCOGroupSpec has the same code as the one
        givenNewISCOGroupSpecs[1].code = givenNewISCOGroupSpecs[0].code;

        const newISCOGroups: INewISCOGroupSpec[] = await repository.createMany(givenNewISCOGroupSpecs);
        // THEN expect only the first and the third the ISCO Groups to be created with the specific attributes
        expect(newISCOGroups).toEqual(
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

    test("should find an ISCO Group by its id", async () => {
      // GIVEN an ISCO Group exists in the database
      const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
      const givenISCOGroup = await repository.create(givenISCOGroupSpecs);

      // WHEN searching for the ISCO Group by its id
      const foundISCOGroup = await repository.findById(givenISCOGroup.id);

      // THEN expect the ISCO Group to be found
      expect(foundISCOGroup).toEqual(givenISCOGroup);
    });

    test("should return null if no ISCO Group with the given id exists", async () => {
      // GIVEN no ISCO Group exists in the database

      // WHEN searching for the ISCO Group by its id
      const foundISCOGroup = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no ISCO Group to be found
      expect(foundISCOGroup).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no ISCO Group exists in the database

      // WHEN searching for the ISCO Group by its id
      const foundISCOGroup = await repository.findById("non_existing_id");

      // THEN expect no ISCO Group to be found
      expect(foundISCOGroup).toBeNull();
    });

    describe("Test ISCO Group hierarchy robustness to inconsistencies", () => {

      test("should ignore parents that are not ISCO Groups", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a parent of an ISCOGroup
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const newSkillSpec: INewSkillSpec = {
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
        };
        const givenSkill = await repositoryRegistry.skill.create(newSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenISCOGroup.modelId),

          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenISCOGroup.id),
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the ISCO Group by its id
        jest.spyOn(console, "error");
        const foundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCO Group to not contain the inconsistent parent
        expect(foundGroup).not.toBeNull();
        expect(foundGroup!.parent).toEqual(null);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not an ISCOGroup: ${inconsistentPair.parentDocModel}`);

      });

      test("should ignore children that are not ISCO Groups | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup document is a child of an ISCOGroup
        // The ISCOGroup
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repository.create(givenISCOGroupSpecs);
        // The non-ISCOGroup in this case a Skill
        const newSkillSpec: INewSkillSpec = {
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
        };
        const givenSkill = await repositoryRegistry.skill.create(newSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenISCOGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup.id),
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the ISCO Group by its id
        jest.spyOn(console, "error");
        const foundGroup = await repository.findById(givenISCOGroup.id);

        // THEN expect the ISCO Group to not contain the inconsistent parent
        expect(foundGroup).not.toBeNull();
        expect(foundGroup!.children).toEqual([]);

        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not an ISCOGroup or Occupation: ${inconsistentPair.childDocModel}`);
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
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the ISCO Group_1 by its id
        const foundGroup_1 = await repository.findById(givenISCOGroup_1.id);

        // THEN expect the ISCO Group to not contain the inconsistent children
        expect(foundGroup_1).not.toBeNull();
        expect(foundGroup_1!.children).toEqual([]);
        expect(foundGroup_1!.parent).toEqual(null);

        // WHEN searching for the ISCO Group_1 by its id
        const foundGroup_2 = await repository.findById(givenISCOGroup_2.id);

        // THEN expect the ISCO Group to not contain the inconsistent children
        expect(foundGroup_2).not.toBeNull();
        expect(foundGroup_2!.children).toEqual([]);
        expect(foundGroup_2!.parent).toEqual(null);
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
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id),
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the ISCO Group_1 by its id
        jest.spyOn(console, "error");
        const foundGroup_1 = await repository.findById(givenISCOGroup_1.id);

        // THEN expect the ISCO Group to not contain the inconsistent children
        expect(foundGroup_1).not.toBeNull();
        expect(foundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed

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
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenISCOGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup,
          parentType: ObjectTypes.ISCOGroup,

          childId: new mongoose.Types.ObjectId(givenISCOGroup_2.id),
          childDocModel: MongooseModelName.ISCOGroup,
          childType: ObjectTypes.ISCOGroup,
        }

        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the ISCO Group_2 by its id
        jest.spyOn(console, "error");
        const foundGroup_2 = await repository.findById(givenISCOGroup_2.id);

        // THEN expect the ISCO Group to not contain the inconsistent parent
        expect(foundGroup_2).not.toBeNull();
        expect(foundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed

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
    const config = getTestConfiguration("ISCOGroupRepositoryTestDB");
    const connection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(connection);
    const repository = repositoryRegistry.ISCOGroup;

    // WHEN connection is lost
    await connection.close(false);

    // THEN expect to reject with an error
    await expect(actionCallback(repository)).rejects.toThrowError(/Client must be connected before running operations/);
  });
}