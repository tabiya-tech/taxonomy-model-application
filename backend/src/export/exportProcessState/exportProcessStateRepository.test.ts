// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { Connection } from "mongoose";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";
import { IExportProcessStateRepository } from "./exportProcessStateRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { INewExportProcessStateSpec } from "./exportProcessState.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";

function getNewExportProcessStateSpec(): INewExportProcessStateSpec {
  return {
    modelId: getMockStringId(2),
    status: ExportProcessStateApiSpecs.Enums.Status.RUNNING,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: "https://example.com",
    timestamp: new Date(),
  };
}

function expectedFromGivenSpec(givenSpec: INewExportProcessStateSpec) {
  return {
    ...givenSpec,
    id: expect.any(String),
    timestamp: expect.any(Date),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test ExportProcessState Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: IExportProcessStateRepository;

  beforeAll(async () => {
    const config = getTestConfiguration("ExportProcessStateRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.exportProcessState;
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

  test("initOnce has registered the repository", async () => {
    // GIVEN that the mongodb uri should be set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().exportProcessState).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false);
  });

  describe("Test create() ExportProcessState", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a new ExportProcessState", async () => {
      // GIVEN a valid newExportProcessStateSpec
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();

      // WHEN creating a new ExportProcessState
      const actualExportProcessState = await repository.create(givenNewExportProcessStateSpec);

      // THEN expect the created ExportProcessState to match the given spec
      expect(actualExportProcessState).toEqual(expectedFromGivenSpec(givenNewExportProcessStateSpec));
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.exportProcessState.create(getNewExportProcessStateSpec());
    });
  });

  describe("Test update() ExportProcessState", () => {
    test("should successfully update an ExportProcessState status", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);

      // WHEN updating the ExportProcessState
      const updatedExportProcessState = await repository.update(createdExportProcessState.id, {
        status: ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
      });

      // THEN expect the updated ExportProcessState to match the given spec
      expect(updatedExportProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewExportProcessStateSpec),
        status: ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
      });
    });

    test("should successfully update an ExportProcessState result", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);
      // AND a new result
      const givenResult = {
        errored: false,
        exportErrors: true,
        exportWarnings: true,
      };

      // WHEN updating the ExportProcessState
      const updatedExportProcessState = await repository.update(createdExportProcessState.id, {
        result: givenResult,
      });

      // THEN expect the updated ExportProcessState to match the given spec
      expect(updatedExportProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewExportProcessStateSpec),
        result: givenResult,
      });
    });

    test("should successfully update an ExportProcessState downloadUrl", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);
      // AND a new downloadUrl
      const givenDownloadUrl = "https://example.com";

      // WHEN updating the ExportProcessState
      const updatedExportProcessState = await repository.update(createdExportProcessState.id, {
        downloadUrl: givenDownloadUrl,
      });

      // THEN expect the updated ExportProcessState to match the given spec
      expect(updatedExportProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewExportProcessStateSpec),
        downloadUrl: givenDownloadUrl,
      });
    });

    test("should successfully update an ExportProcessState timestamp", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);
      // AND a new timestamp
      const givenTimestamp = new Date();

      // WHEN updating the ExportProcessState
      const updatedExportProcessState = await repository.update(createdExportProcessState.id, {
        timestamp: givenTimestamp,
      });

      // THEN expect the updated ExportProcessState to match the given spec
      expect(updatedExportProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewExportProcessStateSpec),
        timestamp: givenTimestamp,
      });
    });

    test("should update an ExportProcessState with a new status, result, downloadUrl and timestamp", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);
      // AND new status, result, downloadUrl and timestamp
      const givenStatus = ExportProcessStateApiSpecs.Enums.Status.COMPLETED;
      const givenResult = {
        errored: false,
        exportErrors: true,
        exportWarnings: true,
      };
      const givenDownloadUrl = "https://example.com";
      const givenTimestamp = new Date();

      // WHEN updating the ExportProcessState
      const updatedExportProcessState = await repository.update(createdExportProcessState.id, {
        status: givenStatus,
        result: givenResult,
        downloadUrl: givenDownloadUrl,
        timestamp: givenTimestamp,
      });

      // THEN expect the updated ExportProcessState to match the given spec
      expect(updatedExportProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewExportProcessStateSpec),
        status: givenStatus,
        result: givenResult,
        downloadUrl: givenDownloadUrl,
        timestamp: givenTimestamp,
      });
    });

    test("should reject with an error when updating an ExportProcessState that does not exist", async () => {
      // GIVEN an id of  ExportProcessState that does not exist
      const givenId = getMockStringId(1);
      // AND valid updateSpecs
      const givenUpdateSpecs = {
        status: ExportProcessStateApiSpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          exportErrors: false,
          exportWarnings: false,
        },
      };

      // WHEN updating the ExportProcessState with an id that does not exist
      const actualUpdatedExportProcessStatePromise = repository.update(givenId, givenUpdateSpecs);

      // THEN expect to reject with an error
      await expect(actualUpdatedExportProcessStatePromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "ExportProcessStateRepository.update: update failed",
          `Update failed to find export process with id: ${givenId}`
        )
      );
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.exportProcessState.update(getMockStringId(1), {
        status: ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
      });
    });
  });

  describe("Test findById() ExportProcessState", () => {
    test("should successfully find an ExportProcessState by id", async () => {
      // GIVEN an ExportProcessState in the database
      const givenNewExportProcessStateSpec = getNewExportProcessStateSpec();
      const createdExportProcessState = await repository.create(givenNewExportProcessStateSpec);

      // WHEN finding the ExportProcessState by id
      const foundExportProcessState = await repository.findById(createdExportProcessState.id);

      // THEN expect the found ExportProcessState to match the created ExportProcessState
      expect(foundExportProcessState).toEqual(createdExportProcessState);
    });

    test("should return null when finding an ExportProcessState by id that does not exist", async () => {
      // GIVEN an id of an ExportProcessState that does not exist
      const givenId = getMockStringId(1);

      // WHEN finding the ExportProcessState by id
      const foundExportProcessState = await repository.findById(givenId);

      // THEN expect the found ExportProcessState to be null
      expect(foundExportProcessState).toBeNull();
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.exportProcessState.findById(getMockStringId(1));
    });
  });
});
