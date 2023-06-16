// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";
import {randomUUID} from "crypto";
import {generateRandomUrl, getTestString} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH
} from "esco/common/modelSchema";
import {INewSkillSpec, ISkill} from "./skillModel";
import {ISkillRepository} from "./SkillRepository";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

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
    altLabels: [getTestString(LABEL_MAX_LENGTH,"1_"), getTestString(LABEL_MAX_LENGTH, "2_" )],
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
    repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skill
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(true);
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
    await getConnectionManager().getCurrentDBConnection()!.close(true);
  });

  describe("Test create() skill", () => {

    afterEach(async () => {
      await repository.Model.deleteMany({})
    })

    test("should successfully create a new skill", async () => {
      // GIVEN a valid SkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with given specifications
      const newModel = await repository.create(givenNewSkillSpec);

      // THEN expect the new skill to be created with the specific attributes
      const expectedNewSkill: ISkill = {
        ...givenNewSkillSpec,
        id: expect.any(String),
        UUID: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }
      expect(newModel).toEqual(expectedNewSkill);
    });

    test("should reject with an error when creating a skill and providing a UUID", async () => {
      // GIVEN a SkillSpec that is otherwise valid but has a UUID
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new SkillSpec with the UUID of the existing
      await expect(repository.create({
        ...givenNewSkillSpec,
        //@ts-ignore
        UUID: randomUUID()
      })).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating skill with an existing UUID", async () => {
      // GIVEN a Skill record exists in the database
      const givenNewSkillSpecSpec: INewSkillSpec = getNewSkillSpec();
      const givenNewModel = await repository.create(givenNewSkillSpecSpec);

      // WHEN Creating a new Skill with the UUID of the existing Skill
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      await expect(repository.create(givenNewSkillSpecSpec)).rejects.toThrowError(/duplicate key/);
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewSkillSpec());
    });
  });

  describe("Test batchCreate() Skill ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    test("should successfully create a batch of new Skills", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
      }

      // WHEN batch creating the Skills with the given specifications
      const newSkills: INewSkillSpec[] = await repository.batchCreate(givenNewSkillSpecs);

      // THEN expect all the Skills to be created with the specific attributes
      expect(newSkills).toEqual(
        expect.arrayContaining(
          givenNewSkillSpecs.map((givenNewSkillSpec) => {
            const expectedNewSkill: ISkill = {
              ...givenNewSkillSpec,
              id: expect.any(String),
              UUID: expect.any(String),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            }
            return expectedNewSkill;
          })
        )
      );
    });

    test("should successfully create a batch of new Skills even if some don't validate", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenValidSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidSkillSpecs[i] = getNewSkillSpec();
      }
      // AND one SkillSpec that is invalid
      const givenInvalidSkillSpec: INewSkillSpec = getNewSkillSpec();
      givenInvalidSkillSpec.preferredLabel = "";

      // WHEN batch creating the Skills with the given specifications
      const newSkills: INewSkillSpec[] = await repository.batchCreate([...givenValidSkillSpecs, givenInvalidSkillSpec]);

      // THEN expect only the valid Skills to be created
      expect(newSkills).toHaveLength(givenValidSkillSpecs.length);

      expect(newSkills).toEqual(
        expect.arrayContaining(
          givenValidSkillSpecs.map((givenNewSkillSpec) => {
            const expectedNewSkill: ISkill = {
              ...givenNewSkillSpec,
              id: expect.any(String),
              UUID: expect.any(String),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            }
            return expectedNewSkill;
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillSpec
      const givenBatchSize = 3;
      const givenValidSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidSkillSpecs[i] = getNewSkillSpec();
        givenValidSkillSpecs[i].preferredLabel = "";
      }
      // WHEN batch creating the Skill with the given specifications
      const newSkills: INewSkillSpec[] = await repository.batchCreate(givenValidSkillSpecs);

      // THEN expect an empty array to be created
      expect(newSkills).toHaveLength(0);
    });
  });
});

function TestConnectionFailure(actionCallback: (repository: ISkillRepository) => Promise<ISkill | null>) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const config = getTestConfiguration("SkillRepositoryTestDB");
    const connection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    repositoryRegistry.initialize(connection);
    const repository = repositoryRegistry.skill;

    // WHEN connection is lost
    await connection.close(true);

    // THEN expect to reject with an error
    await expect(actionCallback(repository)).rejects.toThrowError(/Connection/);
  });
}
