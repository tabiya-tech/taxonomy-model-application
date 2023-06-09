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
      const expectedNewISCO: ISkill = {
        ...givenNewSkillSpec,
        id: expect.any(String),
        UUID: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }
      expect(newModel).toEqual(expectedNewISCO);
    });


    TestConnectionFailure((repository) => {
      return repository.create(getNewSkillSpec());
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
