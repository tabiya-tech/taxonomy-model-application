// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import mongoose, { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes, OccupationType, RelationType } from "esco/common/objectTypes";
import {
  getNewISCOGroupSpec,
  getNewLocalizedOccupationSpec,
  getNewOccupationSpec,
  getNewSkillSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewLocalizedOccupationSpec,
  getSimpleNewOccupationSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  IExtendedLocalizedOccupation,
  ILocalizedOccupation,
  INewLocalizedOccupationSpec,
} from "./localizedOccupation.types";
import { ILocalizedOccupationRepository } from "./localizedOccupationRepository";
import { IOccupation, IOccupationReference } from "esco/occupation/occupation.types";
import { randomUUID } from "crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { expectedISCOGroupReference, expectedOccupationReference } from "esco/_test_utilities/expectedReference";

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
 */
function expectedFromGivenSpec(
  givenSpec: INewLocalizedOccupationSpec,
  localizingOccupation: IOccupation
): IExtendedLocalizedOccupation {
  return {
    ...givenSpec,
    parent: null,
    children: [],
    requiresSkills: [],
    id: expect.any(String),
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    modelId: localizingOccupation.modelId,
    importId: localizingOccupation.importId,
    localizesOccupationId: localizingOccupation.id,
    ISCOGroupCode: localizingOccupation.ISCOGroupCode,
    code: localizingOccupation.code,
    preferredLabel: localizingOccupation.preferredLabel,
    occupationType: OccupationType.LOCALIZED,
    localizedOccupationType: localizingOccupation.occupationType,
    originUUID: localizingOccupation.originUUID,
    ESCOUri: localizingOccupation.ESCOUri,
    definition: localizingOccupation.definition,
    scopeNote: localizingOccupation.scopeNote,
    regulatedProfessionNote: localizingOccupation.regulatedProfessionNote,
  };
}

describe("Test the Occupation Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
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
        givenOccupation
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
        ...givenNewLocalizedOccupationSpec,
        //@ts-ignore
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
      await expect(actualNewOccupationPromise).rejects.toThrowError(/localizingOccupation not found/);
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
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewOccupation.UUID);
        const actualSecondNewLocalizedOccupationSpec: INewLocalizedOccupationSpec = getNewLocalizedOccupationSpec(
          givenOccupation.id
        );
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
            return expectedFromGivenSpec(givenNewOccupationSpec, givenOccupations[index]);
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
            return expectedFromGivenSpec(givenNewOccupationSpec, givenValidOccupations[index]);
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

        // THEN expect only the first and the third the LocalOccupations to be created with the specific attributes
        expect(actualNewLocalizedOccupations).toEqual(
          expect.arrayContaining(
            givenNewLocalizedOccupationSpecs
              .filter((_spec, index) => index !== 1)
              .map((givenNewLocalizedOccupationSpec, index) => {
                return expectedFromGivenSpec(
                  givenNewLocalizedOccupationSpec,
                  givenOccupations[index === 1 ? 2 : index]
                );
              })
          )
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
                  givenOccupations[index === 1 ? 2 : index]
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
});
