// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";

import {randomUUID} from "crypto";
import {generateRandomUrl, getTestString} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "../server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "../server/connection/connectionManager";

import {getTestConfiguration} from "modelInfo/testDataHelper";
import {generateValidCode} from "./skillGroupModel.test";
import {ISkillGroupRepository} from "./SkillGroupRepository";
import {SkillGroupSpec} from "./skillGroupModel";
import {DESCRIPTION_MAX_LENGTH, LABEL_MAX_LENGTH, SCOPE_NOTE_MAX_LENGTH} from "../esco/common/modelSchema";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

function getNewSkillGroupSpec(): SkillGroupSpec {
  return {
    code: generateValidCode(),
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: "",
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: []
  };
}

describe("Test the SkillGroup Repository with an in-memory mongodb", () => {

  let dbConnection: Connection;
  let repository: ISkillGroupRepository;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry()
    repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillGroup;
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

  test("initOnce has registered the ModelRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce()

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skillGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(true);
  });

  describe("Test create() skill group ", () => {

    afterEach(async () => {
      await repository.Model.deleteMany({})
    })

    test("should successfully create a new skill group", async () => {
      // GIVEN a valid SkillGroupSpec
      const givenNewSkillGroupSpec: SkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new skillGroup with given specifications
      const newModel = await repository.create(givenNewSkillGroupSpec);

      // THEN expect the new skillGroup to be created with the specific attributes
      const expectedNewISCO: SkillGroupSpec = {
        ...givenNewSkillGroupSpec,
        originUUID: "",
      }
      expect(newModel).toMatchObject(expectedNewISCO);
    });

    test("should reject with an error when creating a skill group and providing a UUID", async () => {
      // GIVEN a SkillGroupSpec that is otherwise valid but has a UUID
      const givenNewSkillGroupSpec: SkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new SkillGroupSpec with the UUID of the existing
      await expect(repository.create({
        ...givenNewSkillGroupSpec,
        //@ts-ignore
        UUID: randomUUID()
      })).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating skill group with an existing UUID", async () => {
      // GIVEN a SkillGroup record exists in the database
      const givenNewSkillGroupSpecSpec: SkillGroupSpec = getNewSkillGroupSpec();
      const givenNewModel = await repository.create(givenNewSkillGroupSpecSpec);

      // WHEN Creating a new SkillGroup with the UUID of the existing SkillGroup
      expect(givenNewModel).toBeDefined();
      console.log("old given id", givenNewModel.UUID);
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      await expect(repository.create(givenNewSkillGroupSpecSpec)).rejects.toThrowError(/duplicate key/);
    });
  });
});
