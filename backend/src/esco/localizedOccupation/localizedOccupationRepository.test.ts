// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import {
  getNewISCOGroupSpec,
  getNewLocalizedOccupationSpec,
  getNewOccupationSpec, getNewSkillSpec,
  getSimpleNewLocalizedOccupationSpec,
  getSimpleNewOccupationSpec, getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {ILocalizedOccupation, ILocalizedOccupationDoc, INewLocalizedOccupationSpec} from "./localizedOccupation.types";
import { ILocalizedOccupationRepository } from "./localizedOccupationRepository";
import {INewOccupationSpec, IOccupation} from "esco/occupation/occupation.types";
import { randomUUID } from "crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import { Readable } from "node:stream";
import {INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";
import {IOccupationToSkillRelationPairDoc} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import {OccupationType, ReferenceWithRelationType, RelationType} from "esco/common/objectTypes";
import {MongooseModelName} from "esco/common/mongooseModelNames";
import {getExpectedPlan, setUpPopulateWithExplain} from "esco/_test_utilities/populateWithExplainPlan";
import {ISkillReference} from "esco/skill/skills.types";
import {expectedRelatedSkillReference} from "esco/_test_utilities/expectedReference";
import {INDEX_FOR_REQUIRES_SKILLS} from "esco/occupationToSkillRelation/occupationToSkillRelationModel";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected Occupation from a given INewLocalizedOccupationSpec,
 * that can ebe used for assertions
 * @param givenSpec
 * @param localizingOccupation
 * @param newUUID
 */
function expectedFromGivenSpec(
  givenSpec: INewLocalizedOccupationSpec,
  localizingOccupation: IOccupation,
  newUUID: string
): ILocalizedOccupation {
  return {
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    importId: expect.any(String),
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    modelId: localizingOccupation.modelId,
    localizesOccupationId: localizingOccupation.id,
    requiresSkills: []
  };
}

describe("Test the Occupation Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
  });
  afterEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
  });

  let dbConnection: Connection;
  let repository: ILocalizedOccupationRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("LocalizedOccupationRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.localizedOccupation;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple LocalizedOccupations in the db,
   * @param modelId
   * @param batchSize
   */
  async function createLocalizedOccupationsInDB(modelId: string, batchSize: number = 3) {
    const givenOccupationsToBeLocalizedSpecs: INewOccupationSpec[] = [];
    const givenLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      const occupationToBeLocalizedSpec = getSimpleNewOccupationSpec(modelId, `occupation_${i}`);
      // @ts-ignore
      occupationToBeLocalizedSpec._id = new mongoose.Types.ObjectId(i).toHexString(); // setting the id of the occupation to be localized
      givenOccupationsToBeLocalizedSpecs.push(occupationToBeLocalizedSpec);
      // @ts-ignore
      givenLocalizedOccupationSpecs.push(getSimpleNewLocalizedOccupationSpec(modelId, occupationToBeLocalizedSpec._id));
    }
    await repositoryRegistry.occupation.createMany(givenOccupationsToBeLocalizedSpecs);
    return await repository.createMany(modelId, givenLocalizedOccupationSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.ISCOGroup.Model.deleteMany({}).exec();
      await repositoryRegistry.occupation.Model.deleteMany({}).exec();
      await repositoryRegistry.localizedOccupation.Model.deleteMany({}).exec();
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
      await repositoryRegistry.occupationHierarchy.hierarchyModel.deleteMany({}).exec();
    }
  }

  afterEach(async () => {
    await cleanupDBCollections();
  });

  beforeEach(async () => {
    await cleanupDBCollections();
  });
  test("should return the model", async () => {
    expect(repository.Model).toBeDefined();
  });

  test("initOnce has registered the LocalizedOccupationRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().localizedOccupation).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() LocalizedOccupation ", () => {
    test("should successfully create a new Localized Occupation", async () => {
      // GIVEN a localizing OccupationSpec
      const givenOccupationSpec = getNewOccupationSpec(false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

      // AND a valid localized occupation spec
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenOccupation.id
      );

      // WHEN Creating a new localized occupation with given specifications
      const actualNewLocalizedOccupation: ILocalizedOccupation = await repository.create(
        givenNewLocalizedOccupationSpec
      );

      // THEN expect the new localized occupation to be created with the specific attributes
      const expectedNewLocalizedOccupation: ILocalizedOccupation = expectedFromGivenSpec(
        givenNewLocalizedOccupationSpec,
        givenOccupation,
        actualNewLocalizedOccupation.UUID
      );
      expect(actualNewLocalizedOccupation).toEqual(expectedNewLocalizedOccupation);
    });

    test("should successfully create a new localized occupation when the given specifications have an empty UUIDHistory", async () => {
      // GIVEN a localizing OccupationSpec
      const givenOccupationSpec = getNewOccupationSpec(false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

      // AND a valid localized occupation spec
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenOccupation.id
      );
      givenNewLocalizedOccupationSpec.UUIDHistory = [];

      // WHEN Creating a new localized occupation with given specifications
      const actualNewLocalizedOccupation: ILocalizedOccupation = await repository.create(
        givenNewLocalizedOccupationSpec
      );

      // THEN expect the new localized occupation to be created with the specific attributes
      const expectedNewLocalizedOccupation: ILocalizedOccupation = expectedFromGivenSpec(
        givenNewLocalizedOccupationSpec,
        givenOccupation,
        actualNewLocalizedOccupation.UUID
      );
      expect(actualNewLocalizedOccupation).toEqual(expectedNewLocalizedOccupation);
    });

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a localizing OccupationSpec
      const givenOccupationSpec = getNewOccupationSpec(false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
      // AND a LocalizedOccupationSpec that is otherwise valid but has a UUID
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenOccupation.id
      );

      // WHEN Creating a new Localized Occupation with a provided UUID
      const actualNewOccupationPromise = repository.create({
        ...givenNewLocalizedOccupationSpec, //@ts-ignore
        UUID: randomUUID(),
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating a model and providing a localizesOccupationId that does not exist", async () => {
      // GIVEN a LocalizedOccupationSpec that is otherwise valid but has an invalid localizingOccupationId
      const givenInvalidLocalizingOccupationId = getMockStringId(3);
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenInvalidLocalizingOccupationId
      );

      // WHEN Creating a new Localized Occupation from the spec
      const actualNewOccupationPromise = repository.create({
        ...givenNewLocalizedOccupationSpec,
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationPromise).rejects.toThrowError(/The Occupation to be localized was not found/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        // AND a Localized Occupation record exists in the database
        const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
          givenOccupation.id
        );
        const givenNewOccupation = await repository.create(givenNewLocalizedOccupationSpec);

        // WHEN Creating a new Localized Occupation with the same UUID as the existing Localized Occupation
        const givenSecondOccupationSpec = getNewOccupationSpec(false);
        const givenSecondOccupation = await repositoryRegistry.occupation.create(givenSecondOccupationSpec);
        const actualSecondNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
          givenSecondOccupation.id
        );
        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewOccupation.UUID);
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewLocalizedOccupationSpec);

        // THEN expect it to throw an error
        await expect(actualSecondNewOccupationPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
      });

      test("should successfully create a second Identical Occupation in a different model", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

        // AND a Localized Occupation record exists in the database
        const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
          givenOccupation.id
        );
        await repository.create(givenNewLocalizedOccupationSpec);

        // AND a second localizing Occupation exists in a different model
        const givenSecondOccupationSpec = getNewOccupationSpec(false);
        givenSecondOccupationSpec.modelId = getMockStringId(3);
        const givenSecondOccupation = await repositoryRegistry.occupation.create(givenSecondOccupationSpec);

        // WHEN Creating an identical Localized Occupation in a new model (new modelId)
        // @ts-ignore
        const actualSecondNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = {
          ...givenNewLocalizedOccupationSpec,
        };
        actualSecondNewLocalizedOccupationSpec.localizesOccupationId = givenSecondOccupation.id;
        actualSecondNewLocalizedOccupationSpec.modelId = givenSecondOccupation.modelId;
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewLocalizedOccupationSpec);

        // THEN expect the new Occupation to be created
        await expect(actualSecondNewOccupationPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating two LocalizedOccupations from the same occupation", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

        // AND a Localized Occupation record already exists in the database from the same base Occupation
        const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
          givenOccupation.id
        );
        await repository.create(givenNewLocalizedOccupationSpec);

        // WHEN creating another Localized Occupation with the same localizesOccupationId and modelId
        const actualSecondNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = {
          ...givenNewLocalizedOccupationSpec,
        };
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewLocalizedOccupationSpec);

        // THEN expect it to throw an error due to a unique constraint violation
        await expect(actualSecondNewOccupationPromise).rejects.toThrow();
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.localizedOccupation.create(getNewLocalizedOccupationSpec());
    });
  });

  describe("Test createMany() LocalizedOccupation ", () => {
    test("should successfully create a batch of new LocalizedOccupations", async () => {
      // GIVEN some valid LocalizedOccupationSpecs
      const givenBatchSize = 3;
      const givenModelId = getMockStringId(1);
      const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenNewLocalizedOccupationSpecs.push(getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id));
        givenOccupations.push(givenOccupation);
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewLocalizedOccupations: ILocalizedOccupation[] = await repository.createMany(
        givenModelId,
        givenNewLocalizedOccupationSpecs
      );

      // THEN expect all the LocalizedOccupations to be created with the specific attributes
      expect(actualNewLocalizedOccupations).toEqual(
        expect.arrayContaining(
          givenNewLocalizedOccupationSpecs.map((givenNewOccupationSpec, index) => {
            return expectedFromGivenSpec(
              givenNewOccupationSpec,
              givenOccupations[index],
              actualNewLocalizedOccupations[index].UUID
            );
          })
        )
      );
    });

    test("should successfully create a batch of new Localized Occupations even if some don't validate", async () => {
      // GIVEN some valid LocalizedOccupationSpecs
      const givenBatchSize = 3;
      const givenModelId = getMockStringId(1);
      const givenValidNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenValidOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenValidNewLocalizedOccupationSpecs.push(
          getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id)
        );
        givenValidOccupations.push(givenOccupation);
      }
      // AND some invalid LocalizedOccupationSpec
      const givenInvalidNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        const newLocalizedOccupationSpec = getNewLocalizedOccupationSpec(givenOccupation.id);
        // @ts-ignore
        newLocalizedOccupationSpec.foo = "invalid"; // <---- will not validate and will throw an error
        // @ts-ignore
        newLocalizedOccupationSpec.description = undefined; // <---- will not validate and will not throw an error
        givenInvalidNewLocalizedOccupationSpecs.push(newLocalizedOccupationSpec);
      }

      // WHEN creating the batch of LocalizedOccupations with the given specifications
      const actualNewLocalizedOccupations: ILocalizedOccupation[] = await repository.createMany(givenModelId, [
        ...givenValidNewLocalizedOccupationSpecs,
        ...givenInvalidNewLocalizedOccupationSpecs,
      ]);

      // THEN expect only the valid localized occupations to be created
      expect(actualNewLocalizedOccupations).toHaveLength(givenValidNewLocalizedOccupationSpecs.length);
      expect(actualNewLocalizedOccupations).toEqual(
        expect.arrayContaining(
          givenValidNewLocalizedOccupationSpecs.map((givenNewOccupationSpec, index) => {
            return expectedFromGivenSpec(
              givenNewOccupationSpec,
              givenValidOccupations[index],
              actualNewLocalizedOccupations[index].UUID
            );
          })
        )
      );
    });

    test("should successfully create a batch of new localized occupations when they have an empty UUIDHistory", async () => {
      // GIVEN some valid LocalizedOccupationSpecs
      const givenBatchSize = 3;
      const givenModelId = getMockStringId(1);
      const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenNewLocalizedOccupationSpecs[i] = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id);
        givenNewLocalizedOccupationSpecs[i].UUIDHistory = [];
        givenOccupations.push(givenOccupation);
      }

      // WHEN creating the batch of LocalizedOccupations with the given specifications
      const actualNewLocalizedOccupations: ILocalizedOccupation[] = await repository.createMany(
        givenModelId,
        givenNewLocalizedOccupationSpecs
      );

      // THEN expect all the LocalizedOccupations to be created with the specific attributes
      expect(actualNewLocalizedOccupations).toEqual(
        expect.arrayContaining(
          givenNewLocalizedOccupationSpecs.map((givenNewOccupationSpec, index) => {
            return expectedFromGivenSpec(
              givenNewOccupationSpec,
              givenOccupations[index],
              actualNewLocalizedOccupations[index].UUID
            );
          })
        )
      );
    });

    test("should resolve to an empty array if none of the elements could be validated", async () => {
      // GIVEN only invalid OccupationSpec
      const givenBatchSize = 3;
      const givenModelId = getMockStringId(1);
      const givenInvalidNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        const newLocalizedOccupationSpec = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id);
        // @ts-ignore
        newLocalizedOccupationSpec.foo = "invalid"; // <---- will not validate and will throw an error
        givenInvalidNewLocalizedOccupationSpecs.push(newLocalizedOccupationSpec);
      }

      // WHEN creating the batch of LocalizedOccupation with the given specifications
      const actualNewLocalizedOccupations: ILocalizedOccupation[] = await repository.createMany(
        givenModelId,
        givenInvalidNewLocalizedOccupationSpecs
      );

      // THEN expect an empty array to be created
      expect(actualNewLocalizedOccupations).toHaveLength(0);
    });

    test("should not create a localizedOccupation if the localizing occupation does not exist", async () => {
      // GIVEN a LocalizedOccupationSpec that is otherwise valid but has an invalid localizingOccupationId
      const givenModelId = getMockStringId(1);
      const givenInvalidLocalizingOccupationId = getMockStringId(3);
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getSimpleNewLocalizedOccupationSpec(
        givenModelId,
        givenInvalidLocalizingOccupationId
      );
      // AND a valid LocalizedOccupationSpec
      const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `localizing_occupation`, false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
      const givenValidNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getSimpleNewLocalizedOccupationSpec(
        givenModelId,
        givenOccupation.id
      );

      // WHEN Creating a new Localized Occupation from the spec
      const actualNewOccupation = await repository.createMany(givenModelId, [
        givenNewLocalizedOccupationSpec,
        givenValidNewLocalizedOccupationSpec,
      ]);

      // Then expect the creation to not insert the first value
      expect(actualNewOccupation.length).toEqual(1);
      expect(actualNewOccupation[0].localizesOccupationId).toEqual(givenOccupation.id);
    });

    test("should not create a localizedOccupation if the localizing occupation is not an ESCO occupation", async () => {
      // GIVEN a local occupation
      const givenModelId = getMockStringId(1);
      const givenLocalOccupationSpec = getSimpleNewOccupationSpec(givenModelId, "local_occupation", true);
      const givenLocalOccupation = await repositoryRegistry.occupation.create(givenLocalOccupationSpec);
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getSimpleNewLocalizedOccupationSpec(
        givenModelId,
        givenLocalOccupation.id
      );
      // AND a valid LocalizedOccupationSpec
      const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, "occupation", false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
      const givenValidNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getSimpleNewLocalizedOccupationSpec(
        givenModelId,
        givenOccupation.id
      );

      // WHEN Creating a new Localized Occupation from the spec
      const actualNewOccupation = await repository.createMany(givenModelId, [
        givenNewLocalizedOccupationSpec,
        givenValidNewLocalizedOccupationSpec,
      ]);

      // Then expect the creation to not insert the first value
      expect(actualNewOccupation.length).toEqual(1);
      expect(actualNewOccupation[0].localizesOccupationId).toEqual(givenOccupation.id);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN some LocalizedOccupationSpecs
        const givenBatchSize = 3;
        const givenModelId = getMockStringId(1);
        const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
        const givenOccupations: IOccupation[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
          const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
          givenNewLocalizedOccupationSpecs.push(getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id));
          givenOccupations.push(givenOccupation);
        }

        // WHEN creating the batch of LocalizedOccupation with the given specifications (the second LocalizedOccupation having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");

        const actualNewLocalizedOccupations: ILocalizedOccupation[] = await repository.createMany(
          givenModelId,
          givenNewLocalizedOccupationSpecs
        );

        // THEN expect only the first and the third the occupations to be created with the specific attributes
        expect(actualNewLocalizedOccupations).toEqual(
          expect.arrayContaining([
            expectedFromGivenSpec(
              givenNewLocalizedOccupationSpecs[0],
              givenOccupations[0],
              actualNewLocalizedOccupations[0].UUID
            ),
            expectedFromGivenSpec(
              givenNewLocalizedOccupationSpecs[2],
              givenOccupations[2],
              actualNewLocalizedOccupations[1].UUID
            ),
          ])
        );
      });

      test("should return only the documents that did not violate the (modelId and localizesOccupationId) unique index", async () => {
        // GIVEN some LocalizedOccupationSpecs
        const givenBatchSize = 3;
        const givenModelId = getMockStringId(1);
        const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
        const givenOccupations: IOccupation[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          const givenOccupationSpec = getSimpleNewOccupationSpec(givenModelId, `occupation_${i}`, false);
          const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
          givenNewLocalizedOccupationSpecs.push(getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id));
          givenOccupations.push(givenOccupation);
        }

        // WHEN creating the batch of LocalizedOccupations with the given specifications (the second LocalizedOccupation having the same modelId and localizesOccupationId as the first one)
        givenNewLocalizedOccupationSpecs[1].localizesOccupationId =
          givenNewLocalizedOccupationSpecs[0].localizesOccupationId;
        const actualNewOccupations: ILocalizedOccupation[] = await repository.createMany(
          givenModelId,
          givenNewLocalizedOccupationSpecs
        );

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewLocalizedOccupationSpecs
              .filter((_spec, index) => index !== 1)
              .map((givenNewLocalizedOccupationSpec, index) => {
                return expectedFromGivenSpec(
                  givenNewLocalizedOccupationSpec,
                  givenOccupations[index === 1 ? 2 : index],
                  actualNewOccupations[index].UUID
                );
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.localizedOccupation.createMany(getMockStringId(1), [getNewLocalizedOccupationSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find a LocalizedOccupation by its id", async () => {
      // GIVEN a localizing OccupationSpec
      const givenOccupationSpec = getNewOccupationSpec(false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
      // AND a LocalizedOccupation exists in the database
      const givenLocalizedOccupationSpecs = getNewLocalizedOccupationSpec(givenOccupation.id);
      const givenLocalizedOccupation = await repository.create(givenLocalizedOccupationSpecs);

      // WHEN searching for the Occupation by its id
      const actualFoundOccupation = await repository.findById(givenLocalizedOccupation.id);

      // THEN expect the Occupation to be found
      expect(actualFoundOccupation).toEqual(givenLocalizedOccupation);
    });

    test("should return the Localized Occupation with its required Skills", async () => {
      // GIVEN an Occupation to be localized
      const givenModelId = getMockStringId(1);
      const givenOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(givenModelId, "Occupation");
      const givenOccupationToBeLocalized = await repositoryRegistry.occupation.create(givenOccupationToBeLocalizedSpecs);
      // AND a localized occupation with two required Skills in the database
      const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupationToBeLocalized.id);
      const givenSubject = await repository.create(givenSubjectSpecs);

      // AND Some other localized occupation
      const givenOtherOccupationSpecs = getSimpleNewOccupationSpec(givenModelId, "Other Occupation");
      const givenOtherOccupation = await repositoryRegistry.occupation.create(givenOtherOccupationSpecs);
      const givenOtherLocalizedOccupationSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOtherOccupation.id);
      const givenOtherLocalizedOccupation = await repository.create(givenOtherLocalizedOccupationSpecs);

      // The requiredSkill 1
      const givenRequiredSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "Required Skill 1");
      const givenRequiredSkill_1 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_1);
      // The requiredSkill 2
      const givenRequiredSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "Required Skill 2");
      const givenRequiredSkill_2 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_2);

      // AND the subject has two requiredSkills, and the other localized occupation has one
      const actualRelation = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, [
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: OccupationType.LOCALIZED,
          requiredSkillId: givenRequiredSkill_1.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: OccupationType.LOCALIZED,
          requiredSkillId: givenRequiredSkill_2.id,
          relationType: RelationType.OPTIONAL,
        },
        {
          requiringOccupationId: givenOtherLocalizedOccupation.id,
          requiringOccupationType: OccupationType.LOCALIZED,
          requiredSkillId: givenRequiredSkill_1.id,
          relationType: RelationType.ESSENTIAL,
        },
      ]);
      // Guard assertion
      expect(actualRelation).toHaveLength(3);
      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ILocalizedOccupationDoc>(repository.Model);
      const actualFoundLocalizedOccupation = (await repository.findById(givenSubject.id)) as ILocalizedOccupation;

      // THEN expect the subject to be found
      expect(actualFoundLocalizedOccupation).not.toBeNull();

      // AND to have the given requiredSkill
      expect(actualFoundLocalizedOccupation.requiresSkills).toEqual(
        expect.arrayContaining<ReferenceWithRelationType<ISkillReference>>([
          expectedRelatedSkillReference(givenRequiredSkill_1, RelationType.ESSENTIAL),
          expectedRelatedSkillReference(givenRequiredSkill_2, RelationType.OPTIONAL),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(2); // 1 for the requiredSkills and 1 for the skills reference
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the requiresSkills
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationToSkillRelation.relationModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              requiringOccupationType: { $eq: OccupationType.LOCALIZED },
              requiringOccupationId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_REQUIRES_SKILLS,
          }),
        ])
      );
      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    test("should return null if no LocalizedOccupation with the given id exists", async () => {
      // GIVEN no Occupation exists in the database

      // WHEN searching for the Occupation by its id
      const actualFoundOccupation = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no Occupation to be found
      expect(actualFoundOccupation).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no Occupation exists in the database

      // WHEN searching for the Occupation by its id
      const actualFoundOccupation = await repository.findById("non_existing_id");

      // THEN expect no Occupation to be found
      expect(actualFoundOccupation).toBeNull();
    });

    describe("test Occupation to Skill relations robustness to inconsistencies", () => {
      test("should ignore requiresSkills that are not Skills", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenLocalizingOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

        // AND an inconsistency was introduced, and non-Skill document has a requiresSkill relation with an occupation
        const givenLocalizedOccupationSpecs = getNewLocalizedOccupationSpec(givenLocalizingOccupation.id);
        const givenLocalizedOccupation = await repository.create(givenLocalizedOccupationSpecs);

        // The non-Skill in this case an ISCOGroup
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenLocalizedOccupation.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenLocalizedOccupation.id),
          requiringOccupationType: OccupationType.LOCALIZED,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenISCOGroup.id), // <- This is the inconsistency
          //@ts-ignore
          requiredSkillDocModel: MongooseModelName.ISCOGroup, // <- This is the inconsistency
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundOccupation = await repository.findById(givenLocalizedOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent requiresSkill
        expect(actualFoundOccupation).not.toBeNull();
        expect(actualFoundOccupation!.requiresSkills).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Object is not a Skill: ${givenInconsistentPair.requiredSkillDocModel}`);
      });

      test("should not find requiresSkills if the relation is in a different model", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenLocalizingOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

        // AND an inconsistency was introduced, and the requiringOccupation and requiredSkills are in a different model than the relation
        const givenLocalizedOccupationSpecs = getNewLocalizedOccupationSpec(givenLocalizingOccupation.id);
        const givenOccupation = await repository.create(givenLocalizedOccupationSpecs);
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenSkillSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockStringId(3);

        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <- This is the inconsistency

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.LOCALIZED,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for givenOccupation by its id
        const actualFoundOccupation = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent required Skill
        expect(actualFoundOccupation).not.toBeNull();
        expect(actualFoundOccupation!.requiresSkills).toEqual([]);
      });

      test("should not find requiresSkill if it is not is the same model as the requiringOccupation", async () => {
        // GIVEN a localizing OccupationSpec
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenLocalizingOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);

        // AND an inconsistency was introduced, and the requiredSkill and the requiringOccupation are in different models
        const givenLocalizedOccupationSpecs = getNewLocalizedOccupationSpec(givenLocalizingOccupation.id);
        const givenOccupation = await repository.create(givenLocalizedOccupationSpecs);
        const givenSkillSpecs = getNewSkillSpec();
        givenSkillSpecs.modelId = getMockStringId(99); // <-- this is the inconsistency
        const givenSkill = await repositoryRegistry.skill.create(givenSkillSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        //@ts-ignore
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.LOCALIZED,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenSkill.id),
          requiredSkillDocModel: MongooseModelName.Skill,
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the skill by its id
        jest.spyOn(console, "error");
        const givenFoundOccupation = await repository.findById(givenOccupation.id);

        // THEN expect the occupation to not contain the inconsistent requiredSkill
        expect(givenFoundOccupation).not.toBeNull();
        expect(givenFoundOccupation!.requiresSkills).toEqual([]); // <-- The inconsistent occupation is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Required Skill is not in the same model as the Requiring Occupation`);
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.localizedOccupation.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all LocalizedOccupations in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of LocalizedOccupations exist in the database for a given Model
      const givenLocalizedOccupations = await createLocalizedOccupationsInDB(givenModelId);
      // AND some other LocalizedOccupations exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createLocalizedOccupationsInDB(givenModelId_other);

      // WHEN searching for all LocalizedOccupations in the given model of a given type
      const actualLocalizedOccupations = repository.findAll(givenModelId);

      // THEN the LocalizedOccupations should be returned as a consumable stream that emits all LocalizedOccupations
      const actualLocalizedOccupationsArray: ILocalizedOccupation[] = [];
      for await (const data of actualLocalizedOccupations) {
        actualLocalizedOccupationsArray.push(data);
      }
      const expectedLocalizedOccupations = givenLocalizedOccupations.map((LocalizedOccupation) => {
        const { requiresSkills, ...LocalizedOccupationData } = LocalizedOccupation;
        return LocalizedOccupationData;
      });
      expect(actualLocalizedOccupationsArray).toEqual(expectedLocalizedOccupations);
    });

    test("should not return any LocalizedOccupations when the model does not have any and other models have", async () => {
      // GIVEN no LocalizedOccupations exist in the database for the given model
      const givenModelId = getMockStringId(1);
      const givenModelId_other = getMockStringId(2);
      // BUT some other LocalizedOccupations exist in the database for a different model
      await createLocalizedOccupationsInDB(givenModelId_other);

      // WHEN the findAll method is called for LocalizedOccupations
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: ILocalizedOccupation[] = [];
      for await (const data of actualStream) {
        receivedData.push(data);
      }
      expect(receivedData).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN an error occurs during the find operation
      const givenModelId = getMockStringId(1);
      const givenError = new Error("foo");
      jest.spyOn(repository.Model, "find").mockImplementationOnce(() => {
        throw givenError;
      });

      // THEN the findAll method should throw an error for LocalizedOccupations
      expect(() => repository.findAll(givenModelId)).toThrowError(givenError);
    });

    test("should end and emit an error if an error occurs during data retrieval in the upstream", async () => {
      // GIVEN an error occurs during the streaming of the find operation
      const givenError = new Error("foo");
      const mockStream = Readable.from([{ toObject: jest.fn() }]);
      mockStream._read = jest.fn().mockImplementation(() => {
        throw givenError;
      });
      const mockFind = jest.spyOn(repository.Model, "find");
      // @ts-ignore
      mockFind.mockReturnValue({
        cursor: jest.fn().mockImplementationOnce(() => {
          return mockStream;
        }),
      });

      // WHEN searching for all LocalizedOccupations in the given model of a given type
      const actualLocalizedOccupations = repository.findAll(getMockStringId(1));

      // THEN the LocalizedOccupations should be returned as a consumable stream that emits an error and ends
      const actualLocalizedOccupationsArray: ILocalizedOccupation[] = [];
      await expect(async () => {
        for await (const data of actualLocalizedOccupations) {
          actualLocalizedOccupationsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(actualLocalizedOccupations.closed).toBeTruthy();
      expect(actualLocalizedOccupationsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestDBConnectionFailureNoSetup<unknown>(async (repositoryRegistry) => {
      const streamOfLocalizedOccupations = repositoryRegistry.localizedOccupation.findAll(getMockStringId(1));
      for await (const _ of streamOfLocalizedOccupations) {
        // iterate over the stream to hot the db and trigger the error
        // do nothing
      }
    });
  });
});
