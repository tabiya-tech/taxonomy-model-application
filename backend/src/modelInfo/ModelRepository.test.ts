// mute the console output
import "_test_utilities/consoleMock"

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";
import {ModelRepository} from "./ModelRepository";
import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfo,
  INewModelInfoSpec,
  NAME_MAX_LENGTH,
  SHORTCODE_MAX_LENGTH
} from "./modelInfoModel";

import {randomUUID} from "crypto";
import {getTestString} from "_test_utilities/specialCharacters";
import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});


/**
 * Helper function to create an INewModelInfoSpec with random values,
 * that can be used for creating a new ISkillGroup
 */
function getNewModelInfoSpec(): INewModelInfoSpec {
  return {
    name: getTestString(NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(NAME_MAX_LENGTH),
      shortCode: getTestString(SHORTCODE_MAX_LENGTH)
    },
    description: getTestString(DESCRIPTION_MAX_LENGTH),
  };
}

describe("Test the Model Repository with an in-memory mongodb", () => {

  let dbConnection: Connection;
  let repository: ModelRepository;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry()
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.modelInfo;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
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
    expect(getRepositoryRegistry().modelInfo).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() model ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({});
    })

    test("should successfully create a new model", async () => {
      // GIVEN a valid INewModelInfoSpec
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();

      // WHEN Creating a new modelInfo with given specifications
      const newModel = await repository.create(givenNewModelInfoSpec);

      // THEN expect the new modelInfo to be created with the specific attributes
      const expectedNewModelInfo: IModelInfo = {
        ...givenNewModelInfoSpec,
        id: expect.any(String),
        UUID: expect.any(String),
        originUUID: "",
        previousUUID: "",
        version: "",
        releaseNotes: "",
        released: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }
      expect(newModel).toEqual(expectedNewModelInfo);
    });

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a INewModelInfoSpec that is otherwise valid but has a UUID
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
      const providedUUID = randomUUID();

      // WHEN Creating a new modelInfo with the UUID of the existing modelInfo
      await expect(repository.create({
        ...givenNewModelInfoSpec,
        //@ts-ignore
        UUID: providedUUID
      })).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating model with an existing UUID", async () => {
      // GIVEN a model info exists in the database
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
      const givenNewModel = await repository.create(givenNewModelInfoSpec);

      // WHEN Creating a new modelInfo with the UUID of the existing modelInfo
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      await expect(repository.create(givenNewModelInfoSpec)).rejects.toThrowError(/duplicate key/);
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewModelInfoSpec())
    });
  });

  describe("Test getModelById()", () => {
    test("should return an existing model by model id", async () => {
      // GIVEN a model info exists in the database
      const existingModel = await repository.create(getNewModelInfoSpec());

      // WHEN we get a model by the id
      const foundModel = await repository.getModelById(existingModel.id);

      // THEN expect the found model to be equivalent to the existing model
      expect(foundModel).toMatchObject(existingModel);
    })

    test("should return null if model does not exist", async () => {
      // GIVEN a model in the database does not exist
      const existingModel = await repository.create(getNewModelInfoSpec());
      const existingModelId = existingModel.id;
      await repository.Model.deleteOne({_id: {$eq: existingModelId}}).exec();

      // WHEN we get a model by the id
      const foundModel = await repository.getModelById(existingModel.id);

      // THEN expect null
      expect(foundModel).toBeNull();
    })

    TestConnectionFailure((repository) => {
      return repository.getModelById(getMockId(1))
    });
  });

  describe("Test getModelByUUID()", () => {

    test("should return an existing model by model uuid", async () => {
      // GIVEN a model info exists in the database
      const existingModel = await repository.create(getNewModelInfoSpec());

      // WHEN we get a model by the uuid
      const foundModel = await repository.getModelByUUID(existingModel.UUID);

      // THEN expect the found model to be equivalent to the existing model
      expect(foundModel).toMatchObject(existingModel);
    });

    test("should return null if a model with uuid does not exist", async () => {
      // GIVEN a model in the database does not exist
      const existingModel = await repository.create(getNewModelInfoSpec());
      const existingModelId = existingModel.id;
      await repository.Model.deleteOne({_id: {$eq: existingModelId}}).exec();

      // WHEN we get a model by the UUID
      const foundModel = await repository.getModelByUUID(existingModel.UUID);

      // THEN expect null
      expect(foundModel).toBeNull();
    });

    TestConnectionFailure((repository) => {
      return repository.getModelByUUID(randomUUID())
    });
  })
});

function TestConnectionFailure(actionCallback: (repository: ModelRepository) => Promise<IModelInfo | null>) {
  return test("should reject with an error when connection to db is lost", async () => {
    // GIVEN the db connection will be lost
    const config = getTestConfiguration("ModelRepositoryTestDB");
    const connection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(connection);
    const repository = repositoryRegistry.modelInfo;
    // WHEN we get a model by the id
    // THEN expect to reject with an error
    await connection.close(false); // do not force close as there might be pending mongo operations
    await expect(actionCallback(repository)).rejects.toThrowError(/Client must be connected before running operations/);
  });
}