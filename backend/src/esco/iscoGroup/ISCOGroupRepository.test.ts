// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";

import {randomUUID} from "crypto";
import {
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


let _iscoCode = 0;

function getRandomISCOGroupCode(): string {
  //return generateRandomDigitString(1, 4);
  if (_iscoCode > 9999) {
    console.warn("ISCO codes is exhausted! Recycling");
    _iscoCode = 0;
  }
  return (_iscoCode++).toString().padStart(4, '0');
}


function getNewISCOGroupSpec(): INewISCOGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getRandomISCOGroupCode(),
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

  test("initOnce has registered the ISCOGroupRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce()

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().ISCOGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(true);
  });

  describe("Test create() ISCOGroup ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    test("should successfully create a new ISCOGroup", async () => {
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
      const givenNewISCOGroup = await repository.create(givenNewISCOGroupSpec);

      // WHEN Creating a new ISCOGroup with the same UUID as the one the existing ISCOGroup
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewISCOGroup.UUID);
      const secondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      const secondNewISCOGroupPromise = repository.create(secondNewISCOGroupSpec);

      await expect(secondNewISCOGroupPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
    });

    test("should successfully create a second Identical ISCOGroup in a different model", async () => {
      // GIVEN a ISCOGroup record exists in the database for a given model
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      await repository.create(givenNewISCOGroupSpec);

      // WHEN Creating an identical ISCOGroup in a new model (new modelId)
      // @ts-ignore
      const secondNewISCOGroupSpec: INewISCOGroupSpec = {...givenNewISCOGroupSpec};
      secondNewISCOGroupSpec.modelId = getMockId(3);
      const secondNewISCOGroupPromise = repository.create(secondNewISCOGroupSpec);

      // THEN expect the new ISCOGroup to be created
      await expect(secondNewISCOGroupPromise).resolves.toBeDefined();
    });

    test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
      // GIVEN a ISCOGroup record exists in the database
      const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      const givenNewModel = await repository.create(givenNewISCOGroupSpec);

      // WHEN Creating a new ISCOGroup with the same pair of modelId and code as the ones the existing ISCOGroup
      // @ts-ignore
      const secondNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      secondNewISCOGroupSpec.code = givenNewModel.code;
      secondNewISCOGroupSpec.modelId = givenNewModel.modelId;
      const secondNewModelPromise = repository.create(secondNewISCOGroupSpec);

      await expect(secondNewModelPromise).rejects.toThrowError(/duplicate key error collection/);
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewISCOGroupSpec());
    });
  });

  describe("Test batchCreate() ISCOGroup ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    })

    test("should successfully create a batch of new ISCOGroups", async () => {
      // GIVEN some valid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenNewISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewISCOGroupSpecs[i] = getNewISCOGroupSpec();
      }

      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.batchCreate(givenNewISCOGroupSpecs);

      // THEN expect all the ISCO Groups to be created with the specific attributes
      expect(newISCOGroups).toEqual(
        expect.arrayContaining(
          givenNewISCOGroupSpecs.map((givenNewISCOGroupSpec) => {
            const expectedNewISCO: IISCOGroup = {
              ...givenNewISCOGroupSpec,
              id: expect.any(String),
              parentGroup: null,
              childrenGroups: [],
              UUID: expect.any(String),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            }
            return expectedNewISCO;
          })
        )
      );
    });

    test("should successfully create a batch of new ISCOGroups even if some don't validate", async () => {
      // GIVEN some valid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidISCOGroupSpecs[i] = getNewISCOGroupSpec();
      }
      // AND one ISCOGroupSpec that is invalid
      const givenInvalidISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
      givenInvalidISCOGroupSpec.code = "invalid code";

      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.batchCreate([...givenValidISCOGroupSpecs, givenInvalidISCOGroupSpec]);

      // THEN expect only the valid ISCO Group to be created
      expect(newISCOGroups).toHaveLength(givenValidISCOGroupSpecs.length);

      expect(newISCOGroups).toEqual(
        expect.arrayContaining(
          givenValidISCOGroupSpecs.map((givenNewISCOGroupSpec) => {
            const expectedNewISCO: IISCOGroup = {
              ...givenNewISCOGroupSpec,
              id: expect.any(String),
              parentGroup: null,
              childrenGroups: [],
              UUID: expect.any(String),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            }
            return expectedNewISCO;
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid ISCOGroupSpec
      const givenBatchSize = 3;
      const givenValidISCOGroupSpecs: INewISCOGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidISCOGroupSpecs[i] = getNewISCOGroupSpec();
        givenValidISCOGroupSpecs[i].code = "invalid code";
      }
      // WHEN batch creating the ISCO Groups with the given specifications
      const newISCOGroups: INewISCOGroupSpec[] = await repository.batchCreate(givenValidISCOGroupSpecs);

      // THEN expect an empty array to be created
      expect(newISCOGroups).toHaveLength(0);
    });
  });
});

function TestConnectionFailure(actionCallback: (repository: IISCOGroupRepository) => Promise<any>) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const config = getTestConfiguration("ISCOGroupRepositoryTestDB");
    const connection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    repositoryRegistry.initialize(connection);
    const repository = repositoryRegistry.ISCOGroup;

    // WHEN connection is lost
    await connection.close(true);

    // THEN expect to reject with an error
    await expect(actionCallback(repository)).rejects.toThrowError(/Connection/);
  });
}