// Mute chatty console logs
import "_test_utilities/consoleMock";

import AuthAPISpecs from "api-specifications/auth";

import { AccessKeyRepository } from "./accessKeyRepository";
import { AccessKeyType, IAccessKey, IAccessKeyDoc } from "./accessKey.types";
import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { initializeSchemaAndModel } from "./accessKeyModel";

describe("AccessKeyRepository Unit tests", () => {
  let model: mongoose.Model<IAccessKeyDoc>;

  beforeEach(() => {
    model = {
      findOne: jest.fn(),
      create: jest.fn(),
    } as unknown as mongoose.Model<IAccessKeyDoc>;
  });

  describe("findByKeyId", () => {
    test("should return the result from the repository", async () => {
      // GIVEN model.findOne will return a successful response
      const expectedAccessKey = { keyType: "type", keyId: "id" };
      (model.findOne as jest.Mock).mockResolvedValue(expectedAccessKey);

      const givenKeyType = AccessKeyType.API_KEY;
      const givenKeyId = "id";

      // WHEN the repository.findByKeyId is called with the same properties
      const repository = new AccessKeyRepository(model);
      const result = await repository.findByKeyId(givenKeyType, givenKeyId);

      // THEN expect the result to be the same as the one returned by the repository
      expect(result).toEqual(expectedAccessKey);

      // AND expect the model.findOne to have been called with the same properties
      expect(model.findOne).toHaveBeenCalledWith({ keyId: { $eq: givenKeyId }, keyType: { $eq: givenKeyType } });
    });

    test("should handle the failure of repository.findByKeyId", async () => {
      // GIVEN repository.findByKeyId will throw an error
      const givenError = new Error("repository error");
      (model.findOne as jest.Mock).mockRejectedValue(givenError);

      const givenKeyType = AccessKeyType.API_KEY;
      const givenKeyId = "id";

      // WHEN the repository.findByKeyId is called
      const repository = new AccessKeyRepository(model);

      // THEN expect it to throw an error with the expected message
      await expect(repository.findByKeyId(givenKeyType, givenKeyId)).rejects.toThrow(
        "Error finding access key by key id"
      );

      // AND expect console.error to have been called
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));

      // AND expect the error to have the original error as its cause
      expect((console.error as jest.Mock).mock.calls[0][0].cause).toBe(givenError);

      // AND model.findOne should be called with the given properties
      expect(model.findOne).toHaveBeenCalledWith({ keyId: { $eq: givenKeyId }, keyType: { $eq: givenKeyType } });
    });
  });

  describe("create", () => {
    test("should return the result from the repository", async () => {
      // GIVEN repository.create will return a successful response
      const expectedAccessKey = { keyType: "type", keyId: "id" };
      (model.create as jest.Mock).mockResolvedValue(expectedAccessKey);

      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN the repository.create is called with the same properties
      const repository = new AccessKeyRepository(model);
      const result = await repository.create(givenAccessKey);

      // THEN expect the result to be the same as the one returned by the repository
      expect(result).toEqual(expectedAccessKey);

      // AND expect the model.create to have been called with the same properties
      expect(model.create).toHaveBeenCalledWith(givenAccessKey);
    });

    test("should handle the failure of repository.create", async () => {
      // GIVEN repository.create will throw an error
      const givenError = new Error("repository error");
      (model.create as jest.Mock).mockRejectedValue(givenError);

      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN the repository.create is called
      const repository = new AccessKeyRepository(model);

      // THEN expect it to throw an error with the expected message
      await expect(repository.create(givenAccessKey)).rejects.toThrow("Error creating access key");

      // AND expect console.error to have been called
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));

      // AND model.create should be called with the given properties
      expect(model.create).toHaveBeenCalledWith(givenAccessKey);
    });
  });
});

describe("AccessKeyRepository Integration tests", () => {
  let dbConnection: Connection;
  let repository: AccessKeyRepository;
  let model: mongoose.Model<IAccessKeyDoc>;

  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("AccessKeyRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    model = initializeSchemaAndModel(dbConnection);
    repository = new AccessKeyRepository(model);

    // Ensure indexes are created
    await model.init();
    await model.createIndexes();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
  }

  afterEach(async () => {
    await cleanupDBCollections();
  });

  beforeEach(async () => {
    await cleanupDBCollections();
  });

  test("should return the model", () => {
    // WHEN the repository is accessed
    // THEN expect the model to be defined
    expect(repository.Model).toBeDefined();
  });

  describe("Test create()", () => {
    test("should successfully create a new access key with API_KEY type", async () => {
      // GIVEN a valid access key
      const givenAccessKey: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "test-api-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN creating the access key
      const actualAccessKey = await repository.create(givenAccessKey);

      // THEN expect the access key to be created with the given attributes
      expect(actualAccessKey).toEqual(givenAccessKey);
    });

    test("should successfully create a new access key with M2M_CLIENT_ID type", async () => {
      // GIVEN a valid access key with M2M_CLIENT_ID type
      const givenAccessKey: IAccessKey = {
        keyType: AccessKeyType.M2M_CLIENT_ID,
        keyId: "test-m2m-client-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN creating the access key
      const actualAccessKey = await repository.create(givenAccessKey);

      // THEN expect the access key to be created with the given attributes
      expect(actualAccessKey).toEqual(givenAccessKey);
    });

    test("should successfully create multiple access keys with different keyIds", async () => {
      // GIVEN multiple valid access keys with different keyIds
      const givenAccessKey1: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "test-key-1",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      const givenAccessKey2: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "test-key-2",
        role: AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
      };

      // WHEN creating both access keys
      const actualAccessKey1 = await repository.create(givenAccessKey1);
      const actualAccessKey2 = await repository.create(givenAccessKey2);

      // THEN expect both access keys to be created
      expect(actualAccessKey1).toEqual(givenAccessKey1);
      expect(actualAccessKey2).toEqual(givenAccessKey2);
    });

    test("should successfully create access keys with same keyId but different keyType", async () => {
      // GIVEN two access keys with the same keyId but different keyType
      const givenAccessKey1: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "same-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      const givenAccessKey2: IAccessKey = {
        keyType: AccessKeyType.M2M_CLIENT_ID,
        keyId: "same-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
      };

      // WHEN creating both access keys
      const actualAccessKey1 = await repository.create(givenAccessKey1);
      const actualAccessKey2 = await repository.create(givenAccessKey2);

      // THEN expect both access keys to be created
      expect(actualAccessKey1).toEqual(givenAccessKey1);
      expect(actualAccessKey2).toEqual(givenAccessKey2);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating an access key with duplicate keyId and keyType", async () => {
        // GIVEN an access key already exists in the database
        const givenAccessKey: IAccessKey = {
          keyType: AccessKeyType.API_KEY,
          keyId: "duplicate-key-id",
          role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
        };
        await repository.create(givenAccessKey);

        // WHEN attempting to create another access key with the same keyId and keyType
        const duplicateAccessKey: IAccessKey = {
          keyType: AccessKeyType.API_KEY,
          keyId: "duplicate-key-id",
          role: AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER, // different role but same keyId and keyType
        };
        const actualPromise = repository.create(duplicateAccessKey);

        // THEN expect the creation to fail with a duplicate key error
        await expect(actualPromise).rejects.toThrow(
          expect.toMatchErrorWithCause("Error creating access key", /duplicate key/)
        );
      });
    });

    test("should reject with an error when creating an access key with invalid role", async () => {
      // GIVEN an access key with an invalid role
      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "test-key-id",
        role: "INVALID_ROLE", // invalid role
      };

      // WHEN creating the access key
      // THEN expect it to fail
      await expect(repository.create(givenAccessKey as IAccessKey)).rejects.toThrow(/Error creating access key/);
    });

    test("should reject with an error when creating an access key with invalid keyType", async () => {
      // GIVEN an access key with an invalid keyType
      const givenAccessKey = {
        keyType: "INVALID_TYPE", // invalid keyType
        keyId: "test-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN creating the access key
      // THEN expect it to fail
      await expect(repository.create(givenAccessKey as IAccessKey)).rejects.toThrow(/Error creating access key/);
    });

    test("should reject with an error when creating an access key with missing keyId", async () => {
      // GIVEN an access key without a keyId
      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN creating the access key
      // THEN expect it to fail
      await expect(repository.create(givenAccessKey as IAccessKey)).rejects.toThrow(/Error creating access key/);
    });
  });

  describe("Test findByKeyId()", () => {
    test("should find an access key by its keyType and keyId", async () => {
      // GIVEN an access key exists in the database
      const givenAccessKey: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "findable-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      await repository.create(givenAccessKey);

      // WHEN searching for the access key by its keyType and keyId
      const actualFoundAccessKey = await repository.findByKeyId(givenAccessKey.keyType, givenAccessKey.keyId);

      // THEN expect the access key to be found
      expect(actualFoundAccessKey).toEqual(givenAccessKey);
    });

    test("should return null if no access key with the given keyType and keyId exists", async () => {
      // GIVEN no access key exists in the database

      // WHEN searching for a non-existent access key
      const actualFoundAccessKey = await repository.findByKeyId(AccessKeyType.API_KEY, "non-existent-key-id");

      // THEN expect null to be returned
      expect(actualFoundAccessKey).toBeNull();
    });

    test("should return null if keyType matches but keyId does not", async () => {
      // GIVEN an access key exists in the database
      const givenAccessKey: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "existing-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      await repository.create(givenAccessKey);

      // WHEN searching for an access key with the same keyType but different keyId
      const actualFoundAccessKey = await repository.findByKeyId(AccessKeyType.API_KEY, "different-key-id");

      // THEN expect null to be returned
      expect(actualFoundAccessKey).toBeNull();
    });

    test("should return null if keyId matches but keyType does not", async () => {
      // GIVEN an access key exists in the database
      const givenAccessKey: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "existing-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      await repository.create(givenAccessKey);

      // WHEN searching for an access key with the same keyId but different keyType
      const actualFoundAccessKey = await repository.findByKeyId(AccessKeyType.M2M_CLIENT_ID, "existing-key-id");

      // THEN expect null to be returned
      expect(actualFoundAccessKey).toBeNull();
    });

    test("should find the correct access key when multiple access keys exist", async () => {
      // GIVEN multiple access keys exist in the database
      const givenAccessKey1: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "key-1",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      const givenAccessKey2: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "key-2",
        role: AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
      };
      const givenAccessKey3: IAccessKey = {
        keyType: AccessKeyType.M2M_CLIENT_ID,
        keyId: "key-3",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      await repository.create(givenAccessKey1);
      await repository.create(givenAccessKey2);
      await repository.create(givenAccessKey3);

      // WHEN searching for a specific access key
      const actualFoundAccessKey = await repository.findByKeyId(givenAccessKey2.keyType, givenAccessKey2.keyId);

      // THEN expect the correct access key to be found
      expect(actualFoundAccessKey).toEqual(givenAccessKey2);
    });

    test("should find access key with same keyId but different keyType", async () => {
      // GIVEN two access keys with the same keyId but different keyType
      const givenAccessKey1: IAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "shared-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };
      const givenAccessKey2: IAccessKey = {
        keyType: AccessKeyType.M2M_CLIENT_ID,
        keyId: "shared-key-id",
        role: AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER,
      };
      await repository.create(givenAccessKey1);
      await repository.create(givenAccessKey2);

      // WHEN searching for each access key by its keyType and keyId
      const actualFoundAccessKey1 = await repository.findByKeyId(givenAccessKey1.keyType, givenAccessKey1.keyId);
      const actualFoundAccessKey2 = await repository.findByKeyId(givenAccessKey2.keyType, givenAccessKey2.keyId);

      // THEN expect each correct access key to be found
      expect(actualFoundAccessKey1).toEqual(givenAccessKey1);
      expect(actualFoundAccessKey2).toEqual(givenAccessKey2);
    });
  });
});
