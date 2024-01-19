// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes, OccupationType, ReferenceWithRelationType, RelationType } from "esco/common/objectTypes";
import {
  getNewISCOGroupSpec,
  getNewLocalizedOccupationSpec,
  getNewOccupationSpec,
  getNewSkillSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewLocalizedOccupationSpec,
  getSimpleNewOccupationSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  IExtendedLocalizedOccupation,
  ILocalizedOccupation,
  ILocalizedOccupationDoc,
  INewLocalizedOccupationSpec,
} from "./localizedOccupation.types";
import { ILocalizedOccupationRepository } from "./localizedOccupationRepository";
import { INewOccupationSpec, IOccupation, IOccupationReference } from "esco/occupation/occupation.types";
import { randomUUID } from "crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  expectedISCOGroupReference,
  expectedOccupationReference,
  expectedRelatedSkillReference,
} from "esco/_test_utilities/expectedReference";
import { Readable } from "node:stream";
import { INewSkillSpec, ISkillReference } from "esco/skill/skills.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { getExpectedPlan, setUpPopulateWithExplain } from "esco/_test_utilities/populateWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENT } from "esco/occupationHierarchy/occupationHierarchyModel";
import { INDEX_FOR_REQUIRES_SKILLS } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";

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
): IExtendedLocalizedOccupation {
  return {
    ...givenSpec,
    parent: null,
    children: [],
    requiresSkills: [],
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    modelId: localizingOccupation.modelId,
    importId: localizingOccupation.importId,
    localizesOccupationId: localizingOccupation.id,
    ISCOGroupCode: localizingOccupation.ISCOGroupCode,
    code: localizingOccupation.code,
    preferredLabel: localizingOccupation.preferredLabel,
    occupationType: OccupationType.LOCALIZED,
    localizedOccupationType: OccupationType.ESCO,
    originUri: localizingOccupation.originUri,
    definition: localizingOccupation.definition,
    scopeNote: localizingOccupation.scopeNote,
    regulatedProfessionNote: localizingOccupation.regulatedProfessionNote,
  };
}

describe("Test the Localized Occupation Repository with an in-memory mongodb", () => {
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
    return await repository.createMany(givenLocalizedOccupationSpecs);
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
      const actualNewLocalizedOccupation: IExtendedLocalizedOccupation = await repository.create(
        givenNewLocalizedOccupationSpec
      );

      // THEN expect the new localized occupation to be created with the specific attributes
      const expectedNewLocalizedOccupation: IExtendedLocalizedOccupation = expectedFromGivenSpec(
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
      const actualNewLocalizedOccupation: IExtendedLocalizedOccupation = await repository.create(
        givenNewLocalizedOccupationSpec
      );

      // THEN expect the new localized occupation to be created with the specific attributes
      const expectedNewLocalizedOccupation: IExtendedLocalizedOccupation = expectedFromGivenSpec(
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
      // GIVEN a LocalizedOccupationSpec that is otherwise valid but has an invalid lcoalizingOccupationId
      const givenInvalidLocalizingOccupationId = getMockStringId(3);
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenInvalidLocalizingOccupationId
      );

      // WHEN Creating a new Localized Occupation from the spec
      const actualNewOccupationPromise = repository.create({
        ...givenNewLocalizedOccupationSpec,
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationPromise).rejects.toThrowError(
        expect.toMatchErrorWithCause(
          "LocalizedOccupationRepository.create: create failed",
          "LocalizedOccupationRepository.create: localizingOccupation not found"
        )
      );
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
        await expect(actualSecondNewOccupationPromise).rejects.toThrowError(
          expect.toMatchErrorWithCause(
            "LocalizedOccupationRepository.create: create failed",
            /duplicate key .* dup key: { UUID/
          )
        );
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
      const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenNewLocalizedOccupationSpecs.push(getNewLocalizedOccupationSpec(givenOccupation.id));
        givenOccupations.push(givenOccupation);
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewLocalizedOccupations: IExtendedLocalizedOccupation[] = await repository.createMany(
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
      const givenValidNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenValidOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenValidNewLocalizedOccupationSpecs.push(getNewLocalizedOccupationSpec(givenOccupation.id));
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
      const actualNewLocalizedOccupations: IExtendedLocalizedOccupation[] = await repository.createMany([
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
      const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      const givenOccupations: IOccupation[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        givenNewLocalizedOccupationSpecs[i] = getNewLocalizedOccupationSpec(givenOccupation.id);
        givenNewLocalizedOccupationSpecs[i].UUIDHistory = [];
        givenOccupations.push(givenOccupation);
      }

      // WHEN creating the batch of LocalizedOccupations with the given specifications
      const actualNewLocalizedOccupations: IExtendedLocalizedOccupation[] = await repository.createMany(
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
      const givenInvalidNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        const givenOccupationSpec = getNewOccupationSpec(false);
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
        const newLocalizedOccupationSpec = getNewLocalizedOccupationSpec(givenOccupation.id);
        // @ts-ignore
        newLocalizedOccupationSpec.foo = "invalid"; // <---- will not validate and will throw an error
        givenInvalidNewLocalizedOccupationSpecs.push(newLocalizedOccupationSpec);
      }

      // WHEN creating the batch of LocalizedOccupation with the given specifications
      const actualNewLocalizedOccupations: IExtendedLocalizedOccupation[] = await repository.createMany(
        givenInvalidNewLocalizedOccupationSpecs
      );

      // THEN expect an empty array to be created
      expect(actualNewLocalizedOccupations).toHaveLength(0);
    });

    test("should not create a localizedOccupation if the localizing occupation does not exist", async () => {
      // GIVEN a LocalizedOccupationSpec that is otherwise valid but has an invalid localizingOccupationId
      const givenInvalidLocalizingOccupationId = getMockStringId(3);
      const givenNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenInvalidLocalizingOccupationId
      );
      // AND a valid LocalizedOccupationSpec
      const givenOccupationSpec = getNewOccupationSpec(false);
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
      const givenValidNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
        givenOccupation.id
      );

      // WHEN Creating a new Localized Occupation from the spec
      const actualNewOccupation = await repository.createMany([
        givenNewLocalizedOccupationSpec,
        givenValidNewLocalizedOccupationSpec,
      ]);

      // Then expect the creation to not insert the first value
      await expect(actualNewOccupation.length).toEqual(1);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN some LocalizedOccupationSpecs
        const givenBatchSize = 3;
        const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
        const givenOccupations: IOccupation[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          const givenOccupationSpec = getNewOccupationSpec(false);
          const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
          givenNewLocalizedOccupationSpecs.push(getNewLocalizedOccupationSpec(givenOccupation.id));
          givenOccupations.push(givenOccupation);
        }

        // WHEN creating the batch of LocalizedOccupation with the given specifications (the second LocalizedOccupation having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");

        const actualNewLocalizedOccupations: IExtendedLocalizedOccupation[] = await repository.createMany(
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
        const givenNewLocalizedOccupationSpecs: INewLocalizedOccupationSpec[] = [];
        const givenOccupations: IOccupation[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          const givenOccupationSpec = getNewOccupationSpec(false);
          const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpec);
          givenNewLocalizedOccupationSpecs.push(getNewLocalizedOccupationSpec(givenOccupation.id));
          givenOccupations.push(givenOccupation);
        }

        // WHEN creating the batch of LocalizedOccupations with the given specifications (the second LocalizedOccupation having the same modelId and localizesOccupationId as the first one)
        givenNewLocalizedOccupationSpecs[1].localizesOccupationId =
          givenNewLocalizedOccupationSpecs[0].localizesOccupationId;
        const actualNewOccupations: IExtendedLocalizedOccupation[] = await repository.createMany(
          givenNewLocalizedOccupationSpecs
        );

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewLocalizedOccupationSpecs
              .filter((spec, index) => index !== 1)
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
      return repositoryRegistry.localizedOccupation.createMany([getNewLocalizedOccupationSpec()]);
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

    test("should return the Occupation with its parent(ISCOGroup) and children (Occupations)", async () => {
      // GIVEN three LOccupations and one ISCOGroup exists in the database in the same model
      const givenModelId = getMockStringId(1);

      // The localizing occupation (Occupation)
      const givenOccupationSpecs = getSimpleNewOccupationSpec(givenModelId, "Localizing Occupation");
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);
      // THE subject (LocalizedOccupation)
      const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id);
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (ISCO Group)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repositoryRegistry.ISCOGroup.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject Occupation is localized from an occupaiton that has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the givenOccupation
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.Occupation,
          childId: givenOccupation.id,
        },
        {
          // child 1 of the givenOccupation
          parentType: ObjectTypes.Occupation,
          parentId: givenOccupation.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the givenOccupation
          parentType: ObjectTypes.Occupation,
          parentId: givenOccupation.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ILocalizedOccupationDoc>(repository.Model);
      const actualFoundLocalizedOccupation = (await repository.findById(
        givenSubject.id
      )) as IExtendedLocalizedOccupation;

      // THEN expect the subject to be found
      expect(actualFoundLocalizedOccupation).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundLocalizedOccupation.parent).toEqual(expectedISCOGroupReference(givenParent));
      // AND to have the given child
      expect(actualFoundLocalizedOccupation.children).toEqual(
        expect.arrayContaining<IOccupationReference>([
          expectedOccupationReference(givenChild_1),
          expectedOccupationReference(givenChild_2),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(6); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references and 1 for the localizedOccupation
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.Occupation },
              childId: { $in: [new mongoose.Types.ObjectId(givenOccupation.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.Occupation },
              parentId: { $in: [new mongoose.Types.ObjectId(givenOccupation.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );

      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    test("should return the Occupation with its parent(Occupation) and children (Occupations)", async () => {
      // GIVEN four Occupations in the database in the same model
      const givenModelId = getMockStringId(1);
      // The localizing occupation (Occupation)
      const givenOccupationSpecs = getSimpleNewOccupationSpec(givenModelId, "Localizing Occupation");
      const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);
      // THE subject (LocalizedOccupation)
      const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupation.id);
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (Occupation)
      const givenParentSpecs = getSimpleNewOccupationSpec(givenModelId, "parent");
      const givenParent = await repositoryRegistry.occupation.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repositoryRegistry.occupation.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject is localized from an Occupation that has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenParent.id,
          childType: ObjectTypes.Occupation,
          childId: givenOccupation.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenOccupation.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenOccupation.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ILocalizedOccupationDoc>(repository.Model);
      const actualFoundLocalizedOccupation = (await repository.findById(
        givenSubject.id
      )) as IExtendedLocalizedOccupation;

      // THEN expect the subject to be found
      expect(actualFoundLocalizedOccupation).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundLocalizedOccupation.parent).toEqual(expectedOccupationReference(givenParent));
      // AND to have the given child
      expect(actualFoundLocalizedOccupation.children).toEqual(
        expect.arrayContaining<IOccupationReference>([
          expectedOccupationReference(givenChild_1),
          expectedOccupationReference(givenChild_2),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(6); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references and 1 for the localizedOccupation
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.Occupation },
              childId: { $in: [new mongoose.Types.ObjectId(givenOccupation.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.Occupation },
              parentId: { $in: [new mongoose.Types.ObjectId(givenOccupation.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );
      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    test("should return Occupation with its requiresSkills", async () => {
      // GIVEN a Localized Occupation with two required Skills in the database
      const givenModelId = getMockStringId(1);
      // The ESCO occupation to be localized
      const givenOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(
        givenModelId,
        "Occupation to be localized",
        false
      );
      const givenOccupationToBeLocalized = await repositoryRegistry.occupation.create(
        givenOccupationToBeLocalizedSpecs
      );
      // The subject (Localized Occupation)
      const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupationToBeLocalized.id);
      const givenSubject = await repository.create(givenSubjectSpecs);

      // AND Some other ESCO occupation and its localized version
      const givenOtherOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(
        givenModelId,
        "Other Occupation to be localized",
        false
      );
      const givenOtherOccupationToBeLocalized = await repositoryRegistry.occupation.create(
        givenOtherOccupationToBeLocalizedSpecs
      );
      const givenOtherLocalizedOccupationSpecs = getSimpleNewLocalizedOccupationSpec(
        givenModelId,
        givenOtherOccupationToBeLocalized.id
      );
      const giveOtherLocalizedOccupation = await repository.create(givenOtherLocalizedOccupationSpecs);

      // The requiredSkill 1
      const givenRequiredSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "Required Skill 1");
      const givenRequiredSkill_1 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_1);
      // The requiredSkill 2
      const givenRequiredSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "Required Skill 2");
      const givenRequiredSkill_2 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_2);

      // AND the subject requires the two skills, while the other localized occupation requires one of them
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
          requiringOccupationId: giveOtherLocalizedOccupation.id,
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
      const actualFoundLocalizedOccupation = (await repository.findById(
        givenSubject.id
      )) as IExtendedLocalizedOccupation;

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
      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the relatedSkills, 1 for the related skills reference and 1 for the localizing occupation reference
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

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no Occupation exists in the database

      // WHEN searching for the Occupation by its id
      const actualFoundOccupation = await repository.findById("non_existing_id");

      // THEN expect no Occupation to be found
      expect(actualFoundOccupation).toBeNull();
    });

    describe("Test Occupation hierarchy robustness to inconsistencies", () => {
      test("should ignore children that are not Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-Occupation document is a child of an Occupation
        // The Occupation to be localized
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockStringId(1), "occupation_1");
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);
        // The localized occupation
        const givenLocalizedOccupationSpecs = getSimpleNewLocalizedOccupationSpec(
          givenOccupation.modelId,
          givenOccupation.id
        );
        const givenLocalizedOccupation = await repository.create(givenLocalizedOccupationSpecs);
        // The non-Occupation in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          parentId: new mongoose.Types.ObjectId(givenOccupation.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the localized Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenLocalizedOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Child is not an Occupation: ${givenInconsistentPair.childDocModel}`)
        );
      });

      test("should ignore parents that are not ISCO Group | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup or Occupation document is a parent of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockStringId(1), "occupation_1");
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);
        // The localized occupation
        const givenLocalizedOccupationSpecs = getSimpleNewLocalizedOccupationSpec(
          givenOccupation.modelId,
          givenOccupation.id
        );
        const givenLocalizedOccupation = await repository.create(givenLocalizedOccupationSpecs);
        // The non-Occupation in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId), //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenOccupation.id),
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the localized Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenLocalizedOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parent).toEqual(null);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Parent is not an ISCOGroup or an Occupation: ${givenInconsistentPair.parentDocModel}`)
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "occupation_1");
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "occupation_2");
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // The localized occupation_1
        const givenLocalizedOccupation1Specs = getSimpleNewLocalizedOccupationSpec(
          givenModelId_1,
          givenOccupation_1.id
        );
        const givenLocalizedOccupation_1 = await repository.create(givenLocalizedOccupation1Specs);

        // The localized occupation_2
        const givenLocalizedOccupation2Specs = getSimpleNewLocalizedOccupationSpec(
          givenModelId_2,
          givenOccupation_2.id
        );
        const givenLocalizedOccupation_2 = await repository.create(givenLocalizedOccupation2Specs);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the localized Occupation_1 by its id
        const actualFoundLocalizedOccupation_1 = await repository.findById(givenLocalizedOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(actualFoundLocalizedOccupation_1).not.toBeNull();
        expect(actualFoundLocalizedOccupation_1!.children).toEqual([]);
        expect(actualFoundLocalizedOccupation_1!.parent).toEqual(null);

        // WHEN searching for the localized_Occupation_2 by its id
        const actualFoundLocalizedOccupation_2 = await repository.findById(givenLocalizedOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(actualFoundLocalizedOccupation_2).not.toBeNull();
        expect(actualFoundLocalizedOccupation_2!.children).toEqual([]);
        expect(actualFoundLocalizedOccupation_2!.parent).toEqual(null);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "occupation_1");
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "occupation_2");
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // The localized occupation_1
        const givenLocalizedOccupation1Specs = getSimpleNewLocalizedOccupationSpec(
          givenModelId_1,
          givenOccupation_1.id
        );
        const givenLocalizedOccupation_1 = await repository.create(givenLocalizedOccupation1Specs);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Localized Occupation_1 by its id
        jest.spyOn(console, "error");
        const givenFoundLocalizedOccupation_1 = await repository.findById(givenLocalizedOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(givenFoundLocalizedOccupation_1).not.toBeNull();
        expect(givenFoundLocalizedOccupation_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Child is not in the same model as the parent`));
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "occupation_1");
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "occupation_2");
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // The localized occupation_2
        const givenLocalizedOccupation2Specs = getSimpleNewLocalizedOccupationSpec(
          givenModelId_2,
          givenOccupation_2.id
        );
        const givenLocalizedOccupation_2 = await repository.create(givenLocalizedOccupation2Specs);

        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: ObjectTypes.Occupation,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id),
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Localized Occupation_2 by its id
        jest.spyOn(console, "error");
        const actualFoundLocalizedOccupation_2 = await repository.findById(givenLocalizedOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundLocalizedOccupation_2).not.toBeNull();
        expect(actualFoundLocalizedOccupation_2!.parent).toEqual(null); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Parent is not in the same model as the child`));
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        ISCOGroup,  3,        Occupation
        // 1,        2,        Occupation,  4,       Occupation
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND an occupation with a given ID in the given model to be localized later
        const givenID = new mongoose.Types.ObjectId(2);
        const givenOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(
          givenModelId,
          "Occupation_to-be-localized"
        );
        // @ts-ignore
        givenOccupationToBeLocalizedSpecs.id = givenID.toHexString();
        const givenOccupationToBeLocalized = await repositoryRegistry.occupation.create(
          givenOccupationToBeLocalizedSpecs
        );
        // guard to ensure the id is the given one
        expect(givenOccupationToBeLocalized.id).toEqual(givenID.toHexString());

        // AND a subject localized occupation localized from the occupation to be localized
        const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupationToBeLocalized.id);
        const givenSubject = await repository.create(givenSubjectSpecs);

        // AND an ISCOGroup G1 with the same ID as the subject occupation in the given model
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup");
        // @ts-ignore
        givenISCOGroupSpecs.id = givenID.toHexString();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpecs);
        // guard to ensure the id is the given one
        expect(givenISCOGroup.id).toEqual(givenID.toHexString());

        // AND a second occupation O_1 with some ID  in the given model
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId, "occupation_1");
        const givenOccupation_1 = await repositoryRegistry.occupation.create(givenOccupationSpecs_1);

        // AND a third occupation O_2 with some ID in the given model
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId, "occupation_2");
        const givenOccupation_2 = await repositoryRegistry.occupation.create(givenOccupationSpecs_2);

        // AND the ISCOGroup G1 is the parent of O_1
        // AND the subject occupation  is the parent of O_2
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup.id,
            childType: ObjectTypes.Occupation,
            childId: givenOccupation_1.id,
          },
          {
            parentType: ObjectTypes.Occupation,
            parentId: givenOccupationToBeLocalized.id,
            childType: ObjectTypes.Occupation,
            childId: givenOccupation_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.children).toEqual([expectedOccupationReference(givenOccupation_2)]);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating parent", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        ISCOGroup,  3,        ISCOGroup
        // 1,        2,        ISCOGroup,  4,        Occupation

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);

        // AND an ISCOGroup with some ID in the given model
        const givenISCOGroupSpec_1 = getSimpleNewISCOGroupSpec(givenModelId, "iscoGroup");
        const givenISCOGroup_1 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpec_1);

        // AND a second ISCOGroup with a given ID in the given model
        const givenID = new mongoose.Types.ObjectId(2);

        const givenISCOGroupSpec_2 = getSimpleNewISCOGroupSpec(givenModelId, "iscoGroup_2");
        // @ts-ignore
        givenISCOGroupSpec_2.id = givenID.toHexString();
        const givenISCOGroup_2 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpec_2);
        // guard to ensure the id is the given one
        expect(givenISCOGroup_2.id).toEqual(givenID.toHexString());

        // AND a third ISCOGroup with some ID in the given model
        const givenISCOGroupSpec_3 = getSimpleNewISCOGroupSpec(givenModelId, "iscoGroup_3");
        const givenISCOGroup_3 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpec_3);

        // AND an occupation with the given ID that will be localized later
        const givenOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(
          givenModelId,
          "occupation_to_be_localized"
        );
        // @ts-ignore
        givenOccupationToBeLocalizedSpecs.id = givenID.toHexString();
        const givenOccupationToBeLocalized = await repositoryRegistry.occupation.create(
          givenOccupationToBeLocalizedSpecs
        );
        // guard to ensure the id is the given one
        expect(givenOccupationToBeLocalized.id).toEqual(givenID.toHexString());

        // AND a subject localized occupation that is created from the occupationToBeLocalized in the given model
        const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupationToBeLocalized.id);
        const actualSubject = await repository.create(givenSubjectSpecs);
        // guard
        expect(actualSubject.localizesOccupationId).toEqual(givenID.toHexString());

        // AND the iscoGroup 1 is the parent of isco group 2
        // AND the iscoGroup 3 is the parent of the localized esco occupation
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup_1.id,
            childType: ObjectTypes.ISCOGroup,
            childId: givenISCOGroup_2.id,
          },
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup_3.id,
            childType: ObjectTypes.Occupation,
            childId: givenOccupationToBeLocalized.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(actualSubject.id);

        // THEN we expect the subject to have the correct parent
        expect(actualFoundSubject?.parent).toEqual(expectedISCOGroupReference(givenISCOGroup_3));
      });
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
        expect(console.error).toBeCalledWith(
          new Error(`Required Skill is not in the same model as the Requiring Occupation`)
        );
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating requiresSkills", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, requiringOccupationId, requiringOccupationType, requiredSkillId
        // 1,            2,                 ESCO Occupation,               3
        // 1,            2,                 Localized Occupation,          4
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND an occupation in the given model to be localized later
        const givenID = new mongoose.Types.ObjectId(2);
        const givenOccupationToBeLocalizedSpecs = getSimpleNewOccupationSpec(
          givenModelId,
          "Occupation_to-be-localized"
        );
        const givenOccupationToBeLocalized = await repositoryRegistry.occupation.create(
          givenOccupationToBeLocalizedSpecs
        );

        // AND a subject localized occupation localized from the occupation to be localized
        const givenSubjectSpecs = getSimpleNewLocalizedOccupationSpec(givenModelId, givenOccupationToBeLocalized.id);
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an occupation with the same ID as the subject localized occupation in the given model
        const givenOccupationSpecs = getSimpleNewOccupationSpec(givenModelId, "Occupation");
        // @ts-ignore
        givenOccupationSpecs.id = givenID.toHexString();
        const givenOccupation = await repositoryRegistry.occupation.create(givenOccupationSpecs);
        // guard to ensure the id is the given one
        expect(givenOccupation.id).toEqual(givenID.toHexString());

        // AND a skill with some ID  in the given model
        const givenSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "skill_1");
        const givenSkill_1 = await repositoryRegistry.skill.create(givenSkillSpecs_1);

        // AND a second skill with some ID in the given model
        const givenSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "skill_2");
        const givenSkill_2 = await repositoryRegistry.skill.create(givenSkillSpecs_2);
        // AND the Occupation requires skill 1
        // AND the subject occupation requires skill 2
        const actualHierarchy = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, [
          {
            requiringOccupationType: OccupationType.ESCO,
            requiringOccupationId: givenOccupation.id,
            requiredSkillId: givenSkill_1.id,
            relationType: RelationType.ESSENTIAL,
          },
          {
            requiringOccupationType: OccupationType.LOCALIZED,
            requiringOccupationId: givenSubject.id,
            requiredSkillId: givenSkill_2.id,
            relationType: RelationType.OPTIONAL,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.requiresSkills).toEqual([
          expectedRelatedSkillReference(givenSkill_2, RelationType.OPTIONAL),
        ]);
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
        // we have to remove all the populated fields from the expected output since we don't yet populate during findAll
        // That includes all the hierarchy fields and the fields from the occupation that this occupation was localized from
        const {
          parent,
          children,
          preferredLabel,
          regulatedProfessionNote,
          requiresSkills,
          scopeNote,
          localizedOccupationType,
          definition,
          code,
          ISCOGroupCode,
          originUri,
          ...LocalizedOccupationData
        } = LocalizedOccupation;
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
      expect(() => repository.findAll(givenModelId)).toThrowError(
        expect.toMatchErrorWithCause("LocalizedOccupationRepository.findAll: findAll failed", givenError.message)
      );
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

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.localizedOccupation.findAll(getMockStringId(1))
    );
  });
});
