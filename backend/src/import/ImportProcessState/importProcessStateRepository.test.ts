// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { IImportProcessState, INewImportProcessStateSpec } from "./importProcessState.types";
import { IImportProcessStateRepository } from "./importProcessStateRepository";
import ImportProcessStateApiSpecs from "api-specifications/importProcessState/";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";

/**
 * Helper function to create an INewImportProcessStateSpec with random values,
 * that can be used for creating a new IImportProcessState
 */
function getNewImportProcessStatusSpec(): INewImportProcessStateSpec {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    modelId: getMockStringId(2),
    status: ImportProcessStateApiSpecs.Enums.Status.RUNNING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
  };
}

/**
 * Helper function to create an expected IImportProcessState from a given INewImportProcessStateSpec,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewImportProcessStateSpec): IImportProcessState {
  return {
    ...givenSpec,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the ImportProcessState Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: IImportProcessStateRepository;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ImportProcessStateRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.importProcessState;
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

  test("initOnce has registered the ImportProcessStateRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().importProcessState).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() ImportProcessState", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a new ImportProcessState", async () => {
      // GIVEN a valid newImportProcessStateSpec
      const givenNewImportProcessStateSpec: INewImportProcessStateSpec = getNewImportProcessStatusSpec();

      // WHEN Creating a new ImportProcessState with the given specifications
      const actualNewImportProcessState = await repository.create(givenNewImportProcessStateSpec);

      // THEN expect the new ImportProcessState to be created with the specific attributes
      const expectedNewImportProcessState: IImportProcessState = expectedFromGivenSpec(givenNewImportProcessStateSpec);
      expect(actualNewImportProcessState).toEqual(expectedNewImportProcessState);
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.importProcessState.create(getNewImportProcessStatusSpec());
    });
  });

  describe("Test update() ImportProcessState", () => {
    test("should successfully update an ImportProcessState", async () => {
      // GIVEN an ImportProcessState that exists
      const specs = getNewImportProcessStatusSpec();
      specs.status = ImportProcessStateApiSpecs.Enums.Status.PENDING;
      const givenExistingImportProcessState = await repository.create(specs);
      // AND a valid updateSpecs that are different from the existing ImportProcessState
      const givenUpdateSpecs = {
        status: ImportProcessStateApiSpecs.Enums.Status.COMPLETED,
        result: {
          errored: !specs.result.errored,
          parsingErrors: !specs.result.parsingErrors,
          parsingWarnings: !specs.result.parsingWarnings,
        },
      };
      expect(givenExistingImportProcessState.status).not.toEqual(givenUpdateSpecs.status);

      // WHEN updating the ImportProcessState with the given specifications
      const actualUpdatedImportProcessState = await repository.update(
        givenExistingImportProcessState.id,
        givenUpdateSpecs
      );

      // THEN expect the ImportProcessState to be updated with the specific attributes
      expect(actualUpdatedImportProcessState).toEqual({
        ...givenUpdateSpecs,
        id: givenExistingImportProcessState.id,
        modelId: givenExistingImportProcessState.modelId.toString(),
        createdAt: givenExistingImportProcessState.createdAt,
        updatedAt: expect.any(Date),
      });
    });

    test("should reject with an error when updating an ImportProcessState that does not exist", async () => {
      // GIVEN an id of  ImportProcessState that does not exist
      const givenId = getMockStringId(1);
      // AND valid updateSpecs
      const givenUpdateSpecs = {
        status: ImportProcessStateApiSpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      };
      // WHEN updating the ImportProcessState with an id that does not exist
      const actualUpdatedImportProcessStatePromise = repository.update(givenId, givenUpdateSpecs);

      // THEN expect to reject with an error
      await expect(actualUpdatedImportProcessStatePromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "ImportProcessStateRepository.update: failed",
          `Update failed to find import process with id: ${givenId}`
        )
      );
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.importProcessState.update(getMockStringId(1), {
        status: ImportProcessStateApiSpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });
  });
});
