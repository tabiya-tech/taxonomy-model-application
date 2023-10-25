// mute the console output
import "_test_utilities/consoleMock";

import { getMockId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";
import { ModelRepository } from "./ModelInfoRepository";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { IModelInfo, INewModelInfoSpec } from "./modelInfo.types";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState/";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an INewModelInfoSpec with random values
 */
function getNewModelInfoSpec(): INewModelInfoSpec {
  return {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  };
}

describe("Test the Model Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: ModelRepository;
  const repositoryRegistry = new RepositoryRegistry();

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.modelInfo;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  test("Should have the model defined", async () => {
    expect(repository.Model).toBeDefined();
  });

  afterEach(async () => {
    await repository.Model.deleteMany({});
  });

  test("Should have the ModelRepository registered", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().modelInfo).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() model ", () => {
    test("Should create a new model successfully", async () => {
      // GIVEN a valid INewModelInfoSpec
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();

      // WHEN creating a new modelInfo with the given specifications
      const actualNewModel = await repository.create(givenNewModelInfoSpec);

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
        // AND the importProcessState to be set to pending as there is no import process yet
        importProcessState: {
          id: expect.any(String),
          status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
          result: {
            errored: false,
            parsingErrors: false,
            parsingWarnings: false,
          },
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      expect(actualNewModel).toEqual(expectedNewModelInfo);
    });

    test("Should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a INewModelInfoSpec that is otherwise valid
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
      // AND a provided UUID
      const givenProvidedUUID = randomUUID();

      // WHEN Creating a new modelInfo with the given newModelInfoSpec and the providedUUID
      const actualPromise = repository.create({
        ...givenNewModelInfoSpec,
        //@ts-ignore
        UUID: givenProvidedUUID,
      });

      // THEN expect the promise to reject with an error
      await expect(actualPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    test("Should reject with an error when creating a model with a UUID that is not unique", async () => {
      // GIVEN a model info exists in the database
      const givenNewModelInfoSpec: INewModelInfoSpec = getNewModelInfoSpec();
      const givenNewModel = await repository.create(givenNewModelInfoSpec);

      // WHEN creating a new modelInfo with the UUID of the existing modelInfo
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      const actualPromise = repository.create(givenNewModelInfoSpec);

      // THEN expect the promise to reject with an error
      await expect(actualPromise).rejects.toThrowError(/duplicate key/);
    });

    TestDBConnectionFailureNoSetup((repository) => {
      return repository.modelInfo.create(getNewModelInfoSpec());
    });
  });

  describe("Test getModelById()", () => {
    test("Should return an existing model by its id", async () => {
      // GIVEN a new model info exists in the database
      const givenExistingModel = await repository.create(getNewModelInfoSpec());

      // WHEN retrieving a model by its id
      const actualFoundModel = await repository.getModelById(givenExistingModel.id);

      // THEN expect the found model to be equal to the existing model
      expect(actualFoundModel).toEqual(givenExistingModel);
    });

    test("Should return null if the model does not exist", async () => {
      // GIVEN a model in the database does not exist, i.e. the id is not in the database because it was deleted
      const givenExistingModel = await repository.create(getNewModelInfoSpec());
      const givenExistingModelId = givenExistingModel.id;
      await repository.Model.deleteOne({
        _id: { $eq: givenExistingModelId },
      }).exec();

      // WHEN we try to retrieve the deleted model by id
      const actualFoundModel = await repository.getModelById(givenExistingModelId);

      // THEN expect a null
      expect(actualFoundModel).toBeNull();
    });

    TestDBConnectionFailureNoSetup((repository) => {
      return repository.modelInfo.getModelById(getMockId(1));
    });
  });

  describe("Test getModelByUUID()", () => {
    test("Should return an existing model by model uuid", async () => {
      // GIVEN a model info exists in the database
      const givenExistingModel = await repository.create(getNewModelInfoSpec());

      // WHEN we retrieve a model by its uuid
      const actualFoundModel = await repository.getModelByUUID(givenExistingModel.UUID);

      // THEN expect the found model to be equal to the existing model
      expect(actualFoundModel).toEqual(givenExistingModel);
    });

    test("Should return null if a model with the provided UUID does not exist", async () => {
      // GIVEN a model in the database does not exist i.e. the UUID is not in the database because it was deleted
      const givenExistingModel = await repository.create(getNewModelInfoSpec());
      await repository.Model.deleteOne({
        _id: { $eq: givenExistingModel.id },
      }).exec();

      // WHEN we retrieve the deleted model by its UUID
      const actualFoundModel = await repository.getModelByUUID(givenExistingModel.UUID);

      // THEN expect a null
      expect(actualFoundModel).toBeNull();
    });

    TestDBConnectionFailureNoSetup((repository) => {
      return repository.modelInfo.getModelByUUID(randomUUID());
    });
  });

  describe("Test getModels()", () => {
    test("should return all models that exist in the database", async () => {
      // GIVEN N models exist in the database
      const givenExistingModels = [];
      for (let i = 0; i < 3; i++) {
        givenExistingModels.push(await repository.create(getNewModelInfoSpec()));
      }

      // WHEN we retrieve all models from the database
      const actualFoundModels = await repository.getModels();

      // THEN expect to find all models that we created and only those
      expect(actualFoundModels.length).toEqual(givenExistingModels.length);
      givenExistingModels.forEach((givenExistingModel) => {
        expect(actualFoundModels).toContainEqual(givenExistingModel);
      });
    });

    test("should return an empty array when no models exist in the database", async () => {
      // GIVEN no models exist in the database
      const givenEmptyArray: IModelInfo[] = [];

      // WHEN we retrieve all models from the database
      const actualFoundModels = await repository.getModels();

      // THEN expect the result to be an empty array
      expect(actualFoundModels).toEqual(givenEmptyArray);
    });

    TestDBConnectionFailureNoSetup((repository) => {
      return repository.modelInfo.getModels();
    });
  });
});
