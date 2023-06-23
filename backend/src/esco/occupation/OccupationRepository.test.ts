// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import mongoose, {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {
  generateRandomUrl,
  getRandomString,
  getTestString
} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {IOccupationRepository} from "./OccupationRepository";
import {
  DESCRIPTION_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {getMockRandomISCOGroupCode} from "_test_utilities/mockISCOCode";
import {getMockRandomOccupationCode} from "_test_utilities/mockOccupationCode";
import {INewOccupationSpec, IOccupation} from "./occupation.types";
import {INewSkillSpec} from "esco/skill/skills.types";
import {IOccupationHierarchyPairDoc} from "esco/occupationHierarchy/occupationHierarchy.types";
import {ObjectTypes} from "esco/common/objectTypes";
import {MongooseModelName} from "esco/common/mongooseModelNames";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

/**
 * Helper function to create an INewOccupationSpec with random values,
 * that can be used for creating a new Occupation
 */
function getNewOccupationSpec(): INewOccupationSpec {
  return {
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    definition: getTestString(DESCRIPTION_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getRandomString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomOccupationCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: "",
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH)
  };
}

function getSimpleNewOccupationSpec(modelId: string, preferredLabel: string): INewOccupationSpec {
  return {
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    code: getMockRandomOccupationCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: ""
  };
}

/**
 * Helper function to create an expected Occupation from a given INewOccupationSpec,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewOccupationSpec): IOccupation {
  return {
    ...givenSpec,
    parent: null,
    children: [],
    id: expect.any(String),
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the Occupation Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let dbConnection: Connection;
  let repository: IOccupationRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry()
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.occupation;
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

  test("initOnce has registered the OccupationRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce()

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().occupation).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() Occupation ", () => {

    test("should successfully create a new Occupation", async () => {
      // GIVEN a valid OccupationSpec
      const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();

      // WHEN Creating a new ISCO Group with given specifications
      const newOccupation: INewOccupationSpec = await repository.create(givenNewOccupationSpec);

      // THEN expect the new ISCO Group to be created with the specific attributes
      const expectedNewISCO: IOccupation = expectedFromGivenSpec(givenNewOccupationSpec);
      expect(newOccupation).toEqual(expectedNewISCO);
    });

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a OccupationSpec that is otherwise valid but has a UUID
      const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();

      // WHEN Creating a new Occupation with a provided UUID
      const newOccupationPromise = repository.create({
        ...givenNewOccupationSpec,
        //@ts-ignore
        UUID: randomUUID()
      })

      // Then expect the promise to reject with an error
      await expect(newOccupationPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenNewOccupation = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same UUID as the one the existing Occupation
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewOccupation.UUID);
        const secondNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const secondNewOccupationPromise = repository.create(secondNewOccupationSpec);

        await expect(secondNewOccupationPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
      });

      test("should successfully create a second Identical Occupation in a different model", async () => {
        // GIVEN a Occupation record exists in the database for a given model
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        await repository.create(givenNewOccupationSpec);

        // WHEN Creating an identical Occupation in a new model (new modelId)
        // @ts-ignore
        const secondNewOccupationSpec: INewOccupationSpec = {...givenNewOccupationSpec};
        secondNewOccupationSpec.modelId = getMockId(3);
        const secondNewOccupationPromise = repository.create(secondNewOccupationSpec);

        // THEN expect the new Occupation to be created
        await expect(secondNewOccupationPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
        // GIVEN a Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenNewModel = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same pair of modelId and code as the ones the existing Occupation
        // @ts-ignore
        const secondNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        secondNewOccupationSpec.code = givenNewModel.code;
        secondNewOccupationSpec.modelId = givenNewModel.modelId;
        const secondNewModelPromise = repository.create(secondNewOccupationSpec);

        await expect(secondNewModelPromise).rejects.toThrowError(/duplicate key error collection/);
      });
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewOccupationSpec());
    });
  });

  describe("Test createMany() Occupation ", () => {
    test("should successfully create a batch of new Occupations", async () => {
      // GIVEN some valid OccupationSpec
      const givenBatchSize = 3;
      const givenNewOccupationSpecs: INewOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewOccupationSpecs[i] = getNewOccupationSpec();
      }

      // WHEN batch creating the ISCO Groups with the given specifications
      const newOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);

      // THEN expect all the ISCO Groups to be created with the specific attributes
      expect(newOccupations).toEqual(
        expect.arrayContaining(
          givenNewOccupationSpecs.map((givenNewOccupationSpec) => {
            return expectedFromGivenSpec(givenNewOccupationSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new Occupations even if some don't validate", async () => {
      // GIVEN two valid OccupationSpec
      const givenValidOccupationSpecs: INewOccupationSpec[] = [getNewOccupationSpec(), getNewOccupationSpec()];

      // AND two OccupationSpec that is invalid
      const givenInvalidOccupationSpec: INewOccupationSpec [] = [getNewOccupationSpec(),  getNewOccupationSpec()];
      givenInvalidOccupationSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidOccupationSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN batch creating the ISCO Groups with the given specifications
      const newOccupations: INewOccupationSpec[] = await repository.createMany([
        givenValidOccupationSpecs[0],
        ...givenInvalidOccupationSpec,
        givenValidOccupationSpecs[1],
      ]);

      // THEN expect only the valid ISCO Group to be created
      expect(newOccupations).toHaveLength(givenValidOccupationSpecs.length);

      expect(newOccupations).toEqual(
        expect.arrayContaining(
          givenValidOccupationSpecs.map((givenNewOccupationSpec) => {
            return expectedFromGivenSpec(givenNewOccupationSpec);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid OccupationSpec
      const givenBatchSize = 3;
      const givenValidOccupationSpecs: INewOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidOccupationSpecs[i] = getNewOccupationSpec();
        givenValidOccupationSpecs[i].code = "invalid code";
      }
      // WHEN batch creating the ISCO Groups with the given specifications
      const newOccupations: INewOccupationSpec[] = await repository.createMany(givenValidOccupationSpecs);

      // THEN expect an empty array to be created
      expect(newOccupations).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewOccupationSpec();
        }

        // WHEN batch creating the ISCO Groups with the given specifications
        // AND the second OccupationSpec is created with the same UUID as the first one
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");

        const newOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect only the first and the third the ISCO Groups to be created with the specific attributes
        expect(newOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs.filter((spec, index) => index !== 1)
              .map((givenNewOccupationSpec) => {
                return expectedFromGivenSpec(givenNewOccupationSpec);
              })
          )
        );
      });

      test("should return only the documents that did not violate the (modelId and code) unique index", async () => {
        // GIVEN 3 OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewOccupationSpec();
        }

        // WHEN batch creating the Occupation with the given specifications
        // AND the second OccupationSpec has the same code as the one
        givenNewOccupationSpecs[1].code = givenNewOccupationSpecs[0].code;

        const newOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);
        // THEN expect only the first and the third the ISCO Groups to be created with the specific attributes
        expect(newOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs.filter((spec, index) => index !== 1)
              .map((givenNewOccupationSpec) => {
                return expectedFromGivenSpec(givenNewOccupationSpec);
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
    //    return repository.createMany([getNewOccupationSpec()]);
    //  });
  });

  describe("Test findById()", () => {

    test("should find an Occupation by its id", async () => {
      // GIVEN an Occupation exists in the database
      const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockId(1), "occupation_1");
      const givenOccupation = await repository.create(givenOccupationSpecs);

      // WHEN searching for the Occupation by its id
      const foundOccupation = await repository.findById(givenOccupation.id);

      // THEN expect the Occupation to be found
      expect(foundOccupation).toEqual(givenOccupation);
    });

    test("should return null if no Occupation with the given id exists", async () => {
      // GIVEN no Occupation exists in the database

      // WHEN searching for the Occupation by its id
      const foundOccupation = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no Occupation to be found
      expect(foundOccupation).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no Occupation exists in the database

      // WHEN searching for the Occupation by its id
      const foundOccupation = await repository.findById("non_existing_id");

      // THEN expect no Occupation to be found
      expect(foundOccupation).toBeNull();
    });

    describe("Test Occupation hierarchy robustness to inconsistencies", () => {

      test("should ignore children that are not Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-Occupation document is a child of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockId(1), "occupation_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
        // The non-Occupation in this case a Skill
        const newSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenOccupation.modelId,
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
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          parentId: new mongoose.Types.ObjectId(givenOccupation.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const foundGroup = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(foundGroup).not.toBeNull();
        expect(foundGroup!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not an Occupation: ${inconsistentPair.childDocModel}`);

      });

      test("should ignore parents that are not ISCO Group | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup or Occupation document is a parent of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockId(1), "group_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
        // The non-Occupation in this case a Skill
        const newSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenOccupation.modelId,
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
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),
          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenOccupation.id),
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const foundGroup = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(foundGroup).not.toBeNull();
        expect(foundGroup!.parent).toEqual(null);

        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not an ISCOGroup or an Occupation: ${inconsistentPair.parentDocModel}`);
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockId(3);

        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_1 by its id
        const foundGroup_1 = await repository.findById(givenOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(foundGroup_1).not.toBeNull();
        expect(foundGroup_1!.children).toEqual([]);
        expect(foundGroup_1!.parent).toEqual(null);

        // WHEN searching for the Occupation_1 by its id
        const foundGroup_2 = await repository.findById(givenOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(foundGroup_2).not.toBeNull();
        expect(foundGroup_2!.children).toEqual([]);
        expect(foundGroup_2!.parent).toEqual(null);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        }
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_1 by its id
        jest.spyOn(console, "error");
        const foundGroup_1 = await repository.findById(givenOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(foundGroup_1).not.toBeNull();
        expect(foundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed

        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id),
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        }

        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_2 by its id
        jest.spyOn(console, "error");
        const foundGroup_2 = await repository.findById(givenOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(foundGroup_2).not.toBeNull();
        expect(foundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed

        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });
    })
  })
});

function TestConnectionFailure(actionCallback: (repository: IOccupationRepository) => Promise<any>) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const config = getTestConfiguration("OccupationRepositoryTestDB");
    const connection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(connection);
    const repository = repositoryRegistry.occupation;

    // WHEN connection is lost
    await connection.close(false);

    // THEN expect to reject with an error
    await expect(actionCallback(repository)).rejects.toThrowError(/Client must be connected before running operations/);
  });
}