// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";

import {randomUUID} from "crypto";
import {
  generateRandomDigitString,
  generateRandomUrl,
  getRandomString,
  getTestString
} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {IISCOGroupRepository} from "./ISCOGroupRepository";
import {IISCOGroup, INewISCOGroupSpec} from "./ISCOGroupModel";
import {DESCRIPTION_MAX_LENGTH, LABEL_MAX_LENGTH} from "esco/common/modelSchema";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

function getRandomISCOGroupCode(): string {
  return generateRandomDigitString(1, 4);
}

function getNewISCOGroupSpec(): INewISCOGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    ISCOCode: getRandomISCOGroupCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: "",
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH)
  };
}

describe("Test the ISCOGroup Repository with an in-memory mongodb", () => {

  let dbConnection: Connection;
  let repository: IISCOGroupRepository;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ISCOGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry()
    repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.ISCOGroup;
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
    expect(getRepositoryRegistry().ISCOGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(true);
  });

  describe("Test create() model ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    test("should successfully create a new model", async () => {
      // GIVEN a valid ISCOGroupSpec
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();

      // WHEN Creating a new ISCO Group with given specifications
      const newISCOGroup: INewISCOGroupSpec = await repository.create(givenNewISCOGroupSpec);

      // THEN expect the new ISCO Group to be created with the specific attributes
      const expectedNewISCO: IISCOGroup = {
        ...givenNewISCOGroupSpec,
        id: expect.any(String),
        parentGroup: null,
        childrenGroups: [],
        UUID: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }
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

    test("should reject with an error when creating model with an existing UUID", async () => {
      // GIVEN a ISCOGroup record exists in the database
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      const givenNewModel = await repository.create(givenNewISCOGroupSpec);

      // WHEN Creating a new ISCOGroup with the same UUID as the one the existing ISCOGroup
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      const secondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      const secondNewModelPromise = repository.create(secondNewISCOGroupSpec);

      await expect(secondNewModelPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
    });
  });
});