// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { Connection } from "mongoose";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { IEmbeddingProcessStateRepository } from "./embeddingProcessStateRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { INewEmbeddingProcessStateSpec } from "./embeddingProcessState.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";

function getNewEmbeddingProcessStateSpec(): INewEmbeddingProcessStateSpec {
  return {
    modelId: getMockStringId(2),
    status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
    embeddingServiceId: "gemini$$models/gemini-embedding-2",
    totalDocuments: 10,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
  };
}

function expectedFromGivenSpec(givenSpec: INewEmbeddingProcessStateSpec) {
  return {
    ...givenSpec,
    id: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test EmbeddingProcessState Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: IEmbeddingProcessStateRepository;

  beforeAll(async () => {
    const config = getTestConfiguration("EmbeddingProcessStateRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.embeddingProcessState;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false);
    }
  });

  beforeEach(async () => {
    await repository.Model.deleteMany({}).exec();
  });

  afterEach(async () => {
    await repository.Model.deleteMany({}).exec();
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
    expect(getRepositoryRegistry().embeddingProcessState).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false);
  });

  describe("Test create() EmbeddingProcessState", () => {
    test("should successfully create a new EmbeddingProcessState", async () => {
      // GIVEN a valid newEmbeddingProcessStateSpec
      const givenNewEmbeddingProcessStateSpec = getNewEmbeddingProcessStateSpec();

      // WHEN creating a new EmbeddingProcessState
      const actualEmbeddingProcessState = await repository.create(givenNewEmbeddingProcessStateSpec);

      // THEN expect the created EmbeddingProcessState to match the given spec
      expect(actualEmbeddingProcessState).toEqual(expectedFromGivenSpec(givenNewEmbeddingProcessStateSpec));
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.embeddingProcessState.create(getNewEmbeddingProcessStateSpec());
    });
  });

  describe("Test update() EmbeddingProcessState", () => {
    test("should successfully update all the mutable fields of an EmbeddingProcessState", async () => {
      // GIVEN an EmbeddingProcessState in the database
      const givenNewEmbeddingProcessStateSpec = getNewEmbeddingProcessStateSpec();
      const createdEmbeddingProcessState = await repository.create(givenNewEmbeddingProcessStateSpec);
      // AND new values for all the mutable fields
      const givenUpdateSpec = {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
        embeddingServiceId: "gemini$$models/gemini-embedding-2",
        totalDocuments: 20,
        errorCounts: 1,
        warningCounts: 2,
        completedDocuments: 17,
      };

      // WHEN updating the EmbeddingProcessState
      const actualUpdatedEmbeddingProcessState = await repository.update(
        createdEmbeddingProcessState.id,
        givenUpdateSpec
      );

      // THEN expect the updated EmbeddingProcessState to match the given spec
      expect(actualUpdatedEmbeddingProcessState).toEqual({
        ...expectedFromGivenSpec(givenNewEmbeddingProcessStateSpec),
        ...givenUpdateSpec,
      });
    });

    test("should reject with an error when updating an EmbeddingProcessState that does not exist", async () => {
      // GIVEN an id of an EmbeddingProcessState that does not exist
      const givenId = getMockStringId(1);
      // AND valid updateSpecs
      const givenUpdateSpecs = {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      };

      // WHEN updating the EmbeddingProcessState with an id that does not exist
      const actualUpdatedEmbeddingProcessStatePromise = repository.update(givenId, givenUpdateSpecs);

      // THEN expect to reject with an error
      await expect(actualUpdatedEmbeddingProcessStatePromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "EmbeddingProcessStateRepository.update: update failed",
          `Update failed to find embedding process with id: ${givenId}`
        )
      );
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.embeddingProcessState.update(getMockStringId(1), {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      });
    });
  });

  describe("Test findById() EmbeddingProcessState", () => {
    test("should successfully find an EmbeddingProcessState by id", async () => {
      // GIVEN an EmbeddingProcessState in the database
      const givenNewEmbeddingProcessStateSpec = getNewEmbeddingProcessStateSpec();
      const createdEmbeddingProcessState = await repository.create(givenNewEmbeddingProcessStateSpec);

      // WHEN finding the EmbeddingProcessState by id
      const actualFoundEmbeddingProcessState = await repository.findById(createdEmbeddingProcessState.id);

      // THEN expect the found EmbeddingProcessState to match the created EmbeddingProcessState
      expect(actualFoundEmbeddingProcessState).toEqual(createdEmbeddingProcessState);
    });

    test("should return null when finding an EmbeddingProcessState by id that does not exist", async () => {
      // GIVEN an id of an EmbeddingProcessState that does not exist
      const givenId = getMockStringId(1);

      // WHEN finding the EmbeddingProcessState by id
      const actualFoundEmbeddingProcessState = await repository.findById(givenId);

      // THEN expect the found EmbeddingProcessState to be null
      expect(actualFoundEmbeddingProcessState).toBeNull();
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.embeddingProcessState.findById(getMockStringId(1));
    });
  });

  describe("Test findPendingByModelId() EmbeddingProcessState", () => {
    test.each([
      [ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING],
      [ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS],
    ])("should find an unfinished EmbeddingProcessState with status '%s'", async (givenStatus) => {
      // GIVEN an unfinished EmbeddingProcessState in the database for a model
      const givenModelId = getMockStringId(3);
      const givenNewEmbeddingProcessStateSpec = {
        ...getNewEmbeddingProcessStateSpec(),
        modelId: givenModelId,
        status: givenStatus,
      };
      const createdEmbeddingProcessState = await repository.create(givenNewEmbeddingProcessStateSpec);

      // WHEN finding a pending EmbeddingProcessState by the model id
      const actualFoundEmbeddingProcessState = await repository.findPendingByModelId(givenModelId);

      // THEN expect the found EmbeddingProcessState to match the created one
      expect(actualFoundEmbeddingProcessState).toEqual(createdEmbeddingProcessState);
    });

    test("should return null when the only EmbeddingProcessState for the model is completed", async () => {
      // GIVEN a completed EmbeddingProcessState in the database for a model
      const givenModelId = getMockStringId(3);
      await repository.create({
        ...getNewEmbeddingProcessStateSpec(),
        modelId: givenModelId,
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      });

      // WHEN finding a pending EmbeddingProcessState by the model id
      const actualFoundEmbeddingProcessState = await repository.findPendingByModelId(givenModelId);

      // THEN expect the found EmbeddingProcessState to be null
      expect(actualFoundEmbeddingProcessState).toBeNull();
    });

    test("should return null when there is no EmbeddingProcessState for the model", async () => {
      // GIVEN no EmbeddingProcessState in the database for the model
      const givenModelId = getMockStringId(4);

      // WHEN finding a pending EmbeddingProcessState by the model id
      const actualFoundEmbeddingProcessState = await repository.findPendingByModelId(givenModelId);

      // THEN expect the found EmbeddingProcessState to be null
      expect(actualFoundEmbeddingProcessState).toBeNull();
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.embeddingProcessState.findPendingByModelId(getMockStringId(1));
    });
  });

  describe("Test deleteById() EmbeddingProcessState", () => {
    test("should successfully delete an EmbeddingProcessState by id", async () => {
      // GIVEN an EmbeddingProcessState in the database
      const givenNewEmbeddingProcessStateSpec = getNewEmbeddingProcessStateSpec();
      const createdEmbeddingProcessState = await repository.create(givenNewEmbeddingProcessStateSpec);

      // WHEN deleting the EmbeddingProcessState by id
      await repository.deleteById(createdEmbeddingProcessState.id);

      // THEN expect the EmbeddingProcessState to no longer be found
      const actualFoundEmbeddingProcessState = await repository.findById(createdEmbeddingProcessState.id);
      expect(actualFoundEmbeddingProcessState).toBeNull();
    });

    test("should resolve without an error when deleting an EmbeddingProcessState that does not exist", async () => {
      // GIVEN an id of an EmbeddingProcessState that does not exist
      const givenId = getMockStringId(1);

      // WHEN deleting the EmbeddingProcessState by id
      const actualDeletePromise = repository.deleteById(givenId);

      // THEN expect it to resolve without an error
      await expect(actualDeletePromise).resolves.toBeUndefined();
    });

    TestDBConnectionFailureNoSetup((repositoryRegistry) => {
      return repositoryRegistry.embeddingProcessState.deleteById(getMockStringId(1));
    });
  });
});
