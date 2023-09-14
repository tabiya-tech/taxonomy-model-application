// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {generateRandomUrl, getTestString} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH, IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {ISkillRepository} from "./SkillRepository";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {INewSkillSpec, ISkill} from "./skills.types";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

/**
 * Helper function to create an INewSkillSpec with random values,
 * that can be used for creating a new ISkill
 */
function getNewSkillSpec(): INewSkillSpec {
  return {
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: randomUUID(),
    ESCOUri: generateRandomUrl(),
    definition: getTestString(DEFINITION_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    skillType: "knowledge",
    reuseLevel: "cross-sector",
    altLabels: [getTestString(LABEL_MAX_LENGTH, "1_"), getTestString(LABEL_MAX_LENGTH, "2_")],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

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
  };
}

describe("Test the Skill Repository with an in-memory mongodb", () => {

  let dbConnection: Connection;
  let repository: ISkillRepository;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry()
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skill
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
    await initOnce()

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skill).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() skill", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

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
        UUID: randomUUID()
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
      const actualPromise = repository.create(givenNewSkillSpecSpec)
      
      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/duplicate key/);
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewSkillSpec());
    });
  });

  describe("Test createMany() Skill ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

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
      const givenInvalidSkillSpec: INewSkillSpec [] = [getNewSkillSpec(), getNewSkillSpec()];
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
            givenNewSkillSpecs.filter((spec, index) => index !== 1)
              .map((givenNewSkillSpec) => {
                return expectedFromGivenSpec(givenNewSkillSpec);
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
    //    return repository.createMany([getNewSkillSpec()]);
    //  });
  });
});

function TestConnectionFailure(actionCallback: (repository: ISkillRepository) => Promise<ISkill | null>) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const givenConfig = getTestConfiguration("SkillRepositoryTestDB");
    const givenConnection = await getNewConnection(givenConfig.dbURI);
    const givenRepositoryRegistry = new RepositoryRegistry();
    await givenRepositoryRegistry.initialize(givenConnection);
    const givenRepository = givenRepositoryRegistry.skill;

    // WHEN connection is lost
    await givenConnection.close(false);

    // THEN expect to reject with an error
    await expect(actionCallback(givenRepository)).rejects.toThrowError(/Client must be connected before running operations/);
  });
}
