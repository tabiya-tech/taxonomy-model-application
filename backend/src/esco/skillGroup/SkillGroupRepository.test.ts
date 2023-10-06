// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";
import { randomUUID } from "crypto";
import {
  generateRandomUrl,
  getTestString,
} from "_test_utilities/specialCharacters";
import { getNewConnection } from "server/connection/newConnection";
import {
  getRepositoryRegistry,
  RepositoryRegistry,
} from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { ISkillGroupRepository } from "./SkillGroupRepository";
import { INewSkillGroupSpec, ISkillGroup } from "./skillGroup.types";
import {
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an INewSkillGroupSpec with random values,
 * that can be used for creating a new ISkillGroup
 */
function getNewSkillGroupSpec(): INewSkillGroupSpec {
  return {
    code: getMockRandomSkillCode(),
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: randomUUID(),
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [
      getTestString(LABEL_MAX_LENGTH, "1_"),
      getTestString(LABEL_MAX_LENGTH, "2_"),
    ],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an expected ISkillGroup from a given ,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewSkillGroupSpec): ISkillGroup {
  return {
    ...givenSpec,
    id: expect.any(String),
    parentGroups: [],
    childrenGroups: [],
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the SkillGroup Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: ISkillGroupRepository;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    const repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillGroup;
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
    await initOnce();

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skillGroup).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() skill group ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a new skill group", async () => {
      // GIVEN a valid SkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new skillGroup with given specifications
      const actualNewModel = await repository.create(givenNewSkillGroupSpec);

      // THEN expect the new skillGroup to be created with the specific attributes
      const expectedNewSkillGroup: ISkillGroup = expectedFromGivenSpec(
        givenNewSkillGroupSpec
      );
      expect(actualNewModel).toEqual(expectedNewSkillGroup);
    });

    test("should reject with an error when creating a skill group and providing a UUID", async () => {
      // GIVEN a valid newSkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();

      // WHEN Creating a new skill with the given specifications by providing a UUID
      await expect(
        repository.create({
          ...givenNewSkillGroupSpec,
          //@ts-ignore
          UUID: randomUUID(),
        })
      ).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating a skill group with an existing UUID", async () => {
        // GIVEN a SkillGroup record exists in the database
        const givenNewSkillGroupSpecSpec: INewSkillGroupSpec =
          getNewSkillGroupSpec();
        const givenNewModel = await repository.create(
          givenNewSkillGroupSpecSpec
        );

        // WHEN Creating a new SkillGroup with the UUID of the existing SkillGroup
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewModel.UUID);
        const actualPromise = repository.create(givenNewSkillGroupSpecSpec);

        // THEN expect the actual promise to reject
        await expect(actualPromise).rejects.toThrowError(/duplicate key/);
      });
    });

    TestConnectionFailure((repository) => {
      return repository.create(getNewSkillGroupSpec());
    });
  });

  describe("Test createMany() skill group ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a batch of new skill groups", async () => {
      // GIVEN some valid SkillGroupSpec
      const givenBatchSize = 3;
      const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: INewSkillGroupSpec[] =
        await repository.createMany(givenNewSkillGroupSpecs);

      // THEN expect all the Skill Groups to be created with the specific attributes
      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenNewSkillGroupSpecs.map((givenNewSkillGroupSpec) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new skill groups even if some don't validate", async () => {
      // GIVEN two valid SkillGroupSpec
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [
        getNewSkillGroupSpec(),
        getNewSkillGroupSpec(),
      ];
      // AND two SkillGroupSpec that is invalid
      const givenInvalidSkillGroupSpec: INewSkillGroupSpec[] = [
        getNewSkillGroupSpec(),
        getNewSkillGroupSpec(),
      ];
      givenInvalidSkillGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidSkillGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: INewSkillGroupSpec[] =
        await repository.createMany([
          givenValidSkillGroupSpecs[0],
          ...givenInvalidSkillGroupSpec,
          givenValidSkillGroupSpecs[1],
        ]);

      // THEN expect only the valid Skill Group to be created
      expect(actualNewSkillGroups).toHaveLength(
        givenValidSkillGroupSpecs.length
      );

      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenValidSkillGroupSpecs.map((givenNewSkillGroupSpec) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillGroupSpec
      const givenBatchSize = 3;
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidSkillGroupSpecs[i] = getNewSkillGroupSpec();
        givenValidSkillGroupSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: INewSkillGroupSpec[] =
        await repository.createMany(givenValidSkillGroupSpecs);

      // THEN expect no skill to be created
      expect(actualNewSkillGroups).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 SkillGroupSpec
        const givenBatchSize = 3;
        const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
        }

        // WHEN creating the batch of skills Groups with the given specifications (the second SkillGroupSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce(
          "014b0bd8-120d-4ca4-b4c6-40953b170219"
        );
        (randomUUID as jest.Mock).mockReturnValueOnce(
          "014b0bd8-120d-4ca4-b4c6-40953b170219"
        );
        const actualNewSkillGroups: INewSkillGroupSpec[] =
          await repository.createMany(givenNewSkillGroupSpecs);

        // THEN expect only the first and the third the Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenNewSkillGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewSkillGroupSpec) => {
                return expectedFromGivenSpec(givenNewSkillGroupSpec);
              })
          )
        );
      });
    });

    // Testing connection failure with the insetMany() is currently not possible,
    // as there no easy way to simulate a connection failure.
    // Force closing the connection will throw an uncaught exception instead of the operation rejecting.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // Other ways of simulating the connection failure e.g, start/stopping the in memory mongo instance,
    // will cause the test to wait for quite some time, as there is no way to set a maxTime of the insertMany() operation.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // TestConnectionFailure((repository) => {
    //    return repository.createMany([getNewSkillGroupSpec()]);
    //  });
  });
});

function TestConnectionFailure(
  actionCallback: (repository: ISkillGroupRepository) => Promise<any>
) {
  return test("should reject with an error when connection to database is lost", async () => {
    // GIVEN the db connection will be lost
    const givenConfig = getTestConfiguration("SkillGroupRepositoryTestDB");
    const givenConnection = await getNewConnection(givenConfig.dbURI);
    const givenRepositoryRegistry = new RepositoryRegistry();
    await givenRepositoryRegistry.initialize(givenConnection);
    const givenRepository = givenRepositoryRegistry.skillGroup;

    // WHEN connection is lost
    await givenConnection.close(false); // do not force close as there might be pending mongo operations

    // THEN expect to reject with an error
    await expect(actionCallback(givenRepository)).rejects.toThrowError(
      /Client must be connected before running operations/
    );
  });
}
