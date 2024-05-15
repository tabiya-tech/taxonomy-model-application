// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { IOccupationRepository, SearchFilter } from "./occupationRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { INewOccupationSpec, IOccupation, IOccupationDoc } from "./occupation.types";
import { INewSkillSpec, ISkillReference } from "esco/skill/skills.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes, ReferenceWithRelationType, RelationType, SignallingValue } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  getNewISCOGroupSpec,
  getNewSkillSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewSkillSpec,
  getSimpleNewLocalOccupationSpec,
  getNewLocalOccupationSpec,
  getNewESCOOccupationSpec,
  getSimpleNewLocalizedESCOOccupationSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import {
  expectedISCOGroupReference,
  expectedOccupationReference,
  expectedRelatedSkillReference,
} from "esco/_test_utilities/expectedReference";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { Readable } from "node:stream";
import {
  getExpectedPlan,
  setUpFindWithExplain,
  setUpPopulateWithExplain,
} from "esco/_test_utilities/queriesWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENT } from "esco/occupationHierarchy/occupationHierarchyModel";
import { INDEX_FOR_REQUIRES_SKILLS } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE } from "./occupationModel";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected Occupation from a given INewOccupationSpec,
 * that can ebe used for assertions
 * @param givenSpec
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewOccupationSpec, newUUID: string): IOccupation {
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
  };
}

function getNewOccupation(givenOccupationType: ObjectTypes) {
  if (givenOccupationType === ObjectTypes.ESCOOccupation) {
    return getNewESCOOccupationSpec();
  } else if (givenOccupationType == ObjectTypes.LocalOccupation) {
    return getNewLocalOccupationSpec();
  } else {
    throw new Error("Invalid occupation type");
  }
}

describe("Test the Occupation Repository with an in-memory mongodb", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpPopulateWithExplain()
    jest.spyOn(mongoose.Model, "populate").mockRestore();
    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
    //---
    // reset the mock implementation of Model.populate and Query.exec that might have been set up by setUpFindWithExplain()
    jest.spyOn(mongoose.Model, "find").mockRestore();
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
  let repository: IOccupationRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.occupation;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple occupations in the db,
   * @param modelId
   * @param batchSize
   */
  async function createOccupationsInDB(modelId: string, batchSize: number = 3) {
    const givenNewOccupationSpecs: INewOccupationSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewOccupationSpecs.push(getSimpleNewESCOOccupationSpec(modelId, `ESCO_occupation_${i}`));
      givenNewOccupationSpecs.push(getSimpleNewLocalizedESCOOccupationSpec(modelId, `ESCO_occupation_localized${i}`));
      givenNewOccupationSpecs.push(getSimpleNewLocalOccupationSpec(modelId, `Local_occupation_${i}`));
    }
    return await repository.createMany(givenNewOccupationSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.ISCOGroup.Model.deleteMany({}).exec();
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

  test("initOnce has registered the OccupationRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().occupation).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() Occupation ", () => {
    test.each([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation])(
      "should successfully create a new %s Occupation",
      async (givenOccupationType) => {
        // GIVEN a valid OccupationSpec
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupation(givenOccupationType);
        // WHEN Creating a new occupation with given specifications
        const actualNewOccupation: IOccupation = await repository.create(givenNewOccupationSpec);

        // THEN expect the new occupation to be created with the specific attributes
        const expectedNewISCO: IOccupation = expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupation.UUID);
        expect(actualNewOccupation).toEqual(expectedNewISCO);
      }
    );

    test.each([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation])(
      "should successfully create a new %s occupation when the given specifications have an empty UUIDHistory",
      async (givenOccupationType) => {
        // GIVEN a valid OccupationSpec that has an empty UUIDHistory
        // GIVEN a valid OccupationSpec
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupation(givenOccupationType);
        givenNewOccupationSpec.UUIDHistory = [];

        // WHEN Creating a new occupation with given specifications
        const actualNewOccupation: IOccupation = await repository.create(givenNewOccupationSpec);

        // THEN expect the new occupation to be created with the specific attributes
        const expectedNewISCO: IOccupation = expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupation.UUID);
        expect(actualNewOccupation).toEqual(expectedNewISCO);
      }
    );

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a OccupationSpec that is otherwise valid but has a UUID
      const givenNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();

      // WHEN Creating a new Occupation with a provided UUID
      const actualNewOccupationPromise = repository.create({
        ...givenNewOccupationSpec, //@ts-ignore
        UUID: randomUUID(),
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN an Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();
        const givenNewOccupation = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same UUID as the one the existing Occupation
        const actualSecondNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();

        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewOccupation.UUID);
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewOccupationSpec);

        // THEN expect it to throw an error
        await expect(actualSecondNewOccupationPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(
            "OccupationRepository.create: create failed.",
            /duplicate key .* dup key: { UUID/
          )
        );
      });

      test("should successfully create a second Identical Occupation in a different model", async () => {
        // GIVEN an Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();
        await repository.create(givenNewOccupationSpec);

        // WHEN Creating an identical Occupation in a new model (new modelId)
        // @ts-ignore
        const actualSecondNewOccupationSpec: INewOccupationSpec = {
          ...givenNewOccupationSpec,
        };
        actualSecondNewOccupationSpec.modelId = getMockStringId(3);
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewOccupationSpec);

        // THEN expect the new Occupation to be created
        await expect(actualSecondNewOccupationPromise).resolves.toBeDefined();
      });

      test("should reject with an error when creating a pair of (modelId and code) is duplicated", async () => {
        // GIVEN an Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();
        const givenNewModel = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same pair of modelId and code as the ones the existing Occupation
        const actualSecondNewOccupationSpec: INewOccupationSpec = getNewESCOOccupationSpec();
        actualSecondNewOccupationSpec.code = givenNewModel.code;
        actualSecondNewOccupationSpec.modelId = givenNewModel.modelId;
        const actualSecondNewModelPromise = repository.create(actualSecondNewOccupationSpec);

        // THEN expect it to throw an error
        await expect(actualSecondNewModelPromise).rejects.toThrow(
          expect.toMatchErrorWithCause(
            "OccupationRepository.create: create failed.",
            /duplicate key .* dup key: { modelId: .* code: .* }/
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.occupation.create(getNewESCOOccupationSpec());
    });
  });

  describe("Test createMany() Occupation ", () => {
    test.each([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation])(
      "should successfully create a batch of new %s Occupations",
      async (givenOccupationType) => {
        // GIVEN some valid OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewOccupation(givenOccupationType);
        }

        // WHEN creating the batch of occupations with the given specifications
        const actualNewOccupations: IOccupation[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect all the occupations to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs.map((givenNewOccupationSpec, index) => {
              return expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupations[index].UUID);
            })
          )
        );
      }
    );

    test.each([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation])(
      "should successfully create a batch of new %s Occupations even if some don't validate",
      async (givenOccupationType) => {
        // GIVEN two valid OccupationSpec
        const givenValidOccupationSpecs: INewOccupationSpec[] = [
          getNewOccupation(givenOccupationType),
          getNewOccupation(givenOccupationType),
        ];
        // AND two OccupationSpec that is invalid
        const givenInvalidOccupationSpec: INewOccupationSpec[] = [
          getNewOccupation(givenOccupationType),
          getNewOccupation(givenOccupationType),
        ];
        givenInvalidOccupationSpec[0].code = "invalid code"; // will not validate but will not throw an error
        // @ts-ignore
        givenInvalidOccupationSpec[1].foo = "invalid"; // will not validate and will throw an error

        // WHEN creating the batch of occupations with the given specifications
        const actualNewOccupations: IOccupation[] = await repository.createMany([
          givenValidOccupationSpecs[0],
          ...givenInvalidOccupationSpec,
          givenValidOccupationSpecs[1],
        ]);

        // THEN expect only the valid occupations to be created
        expect(actualNewOccupations).toHaveLength(givenValidOccupationSpecs.length);
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenValidOccupationSpecs.map((givenNewOccupationSpec, index) => {
              return expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupations[index].UUID);
            })
          )
        );
      }
    );

    test.each([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation])(
      "should successfully create a batch of new %s occupations when they have an empty UUIDHistory",
      async (givenOccupationType) => {
        // GIVEN some valid OccupationSpec that have an empty UUIDHistory
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewOccupation(givenOccupationType);
          givenNewOccupationSpecs[i].UUIDHistory = [];
        }

        // WHEN creating the batch of occupations with the given specifications
        const actualNewOccupations: IOccupation[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect all the occupations to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs.map((givenNewOccupationSpec, index) => {
              return expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupations[index].UUID);
            })
          )
        );
      }
    );

    test("should resolve to an empty array if none of the elements could be validated", async () => {
      // GIVEN only invalid OccupationSpec
      const givenBatchSize = 3;
      const givenValidOccupationSpecs: INewOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidOccupationSpecs[i] = getNewESCOOccupationSpec();
        givenValidOccupationSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of occupations with the given specifications
      const actualNewOccupations: INewOccupationSpec[] = await repository.createMany(givenValidOccupationSpecs);

      // THEN expect an empty array to be created
      expect(actualNewOccupations).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewESCOOccupationSpec();
        }

        // WHEN creating the batch of occupations with the given specifications (the second occupation having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewOccupations: IOccupation[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect only the first and the third the occupations to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs
              .filter((_, index) => index !== 1)
              .map((givenNewOccupationSpec, index) => {
                return expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupations[index].UUID);
              })
          )
        );
      });

      test("should return only the documents that did not violate the (modelId and code) unique index", async () => {
        // GIVEN 3 OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getSimpleNewESCOOccupationSpec(getMockStringId(1), `ESCO_occupation_${i}`);
        }

        // WHEN creating the batch of occupations with the given specifications (the second occupations having the same CODE as the first one)
        givenNewOccupationSpecs[1].code = givenNewOccupationSpecs[0].code;
        const actualNewOccupations: IOccupation[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect only the first and the third the occupations to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs
              .filter((_, index) => index !== 1)
              .map((givenNewOccupationSpec, index) => {
                return expectedFromGivenSpec(givenNewOccupationSpec, actualNewOccupations[index].UUID);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.occupation.createMany([getNewESCOOccupationSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find an Occupation by its id", async () => {
      // GIVEN an Occupation exists in the database
      const givenOccupationSpecs = getSimpleNewESCOOccupationSpec(getMockStringId(1), "occupation_1");
      const givenOccupation = await repository.create(givenOccupationSpecs);

      // WHEN searching for the Occupation by its id
      const actualFoundOccupation = await repository.findById(givenOccupation.id);

      // THEN expect the Occupation to be found
      expect(actualFoundOccupation).toEqual(givenOccupation);
    });

    test("should return null if no Occupation with the given id exists", async () => {
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
      // GIVEN three Occupations and one ISCOGroup exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (Occupation)
      const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (ISCO Group)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repositoryRegistry.ISCOGroup.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject Occupation has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: givenSubject.occupationType,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: givenSubject.occupationType,
          parentId: givenSubject.id,
          childType: givenChild_1.occupationType,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: givenSubject.occupationType,
          parentId: givenSubject.id,
          childType: givenChild_2.occupationType,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<IOccupationDoc>(repository.Model);
      const actualFoundOccupation = (await repository.findById(givenSubject.id)) as IOccupation;

      // THEN expect the subject to be found
      expect(actualFoundOccupation).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundOccupation.parent).toEqual(expectedISCOGroupReference(givenParent));
      // AND to have the given child
      expect(actualFoundOccupation.children).toEqual(
        expect.arrayContaining<IOccupationReference>([
          expectedOccupationReference(givenChild_1),
          expectedOccupationReference(givenChild_2),
        ])
      );
      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: givenSubject.occupationType },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: givenSubject.occupationType },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
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
      // THE subject (Occupation)
      const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (Occupation)
      const givenParentSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject Occupation has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: givenParent.occupationType,
          parentId: givenParent.id,
          childType: givenSubject.occupationType,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: givenSubject.occupationType,
          parentId: givenSubject.id,
          childType: givenChild_1.occupationType,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: givenSubject.occupationType,
          parentId: givenSubject.id,
          childType: givenChild_2.occupationType,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<IOccupationDoc>(repository.Model);
      const actualFoundOccupation = (await repository.findById(givenSubject.id)) as IOccupation;

      // THEN expect the subject to be found
      expect(actualFoundOccupation).not.toBeNull();

      // AND to have the given parent
      expect(actualFoundOccupation.parent).toEqual(expectedOccupationReference(givenParent));
      // AND to have the given child
      expect(actualFoundOccupation.children).toEqual(
        expect.arrayContaining<IOccupationReference>([
          expectedOccupationReference(givenChild_1),
          expectedOccupationReference(givenChild_2),
        ])
      );

      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: givenSubject.occupationType },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENT,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: givenSubject.occupationType },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );
      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    test("should return Occupation with its required Skills", async () => {
      // GIVEN an Occupation with two required Skills in the database
      const givenModelId = getMockStringId(1);
      const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "Subject Occupation");
      const givenSubject = await repositoryRegistry.occupation.create(givenSubjectSpecs);

      // AND Some other occupation
      const givenOtherOccupationSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "Other Occupation");
      const givenOtherOccupation = await repositoryRegistry.occupation.create(givenOtherOccupationSpecs);

      // The requiredSkill 1
      const givenRequiredSkillSpecs_1 = getSimpleNewSkillSpec(givenModelId, "Required Skill 1");
      const givenRequiredSkill_1 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_1);
      // The requiredSkill 2
      const givenRequiredSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "Required Skill 2");
      const givenRequiredSkill_2 = await repositoryRegistry.skill.create(givenRequiredSkillSpecs_2);

      // AND the subject has two requiredSkills, and the other occupation has one
      const actualRelation = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, [
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: givenSubject.occupationType,
          requiredSkillId: givenRequiredSkill_1.id,
          relationType: RelationType.ESSENTIAL,
          signallingValueLabel: SignallingValue.NONE,
        },
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: givenSubject.occupationType,
          requiredSkillId: givenRequiredSkill_2.id,
          relationType: RelationType.OPTIONAL,
          signallingValueLabel: SignallingValue.NONE,
        },
        {
          requiringOccupationId: givenOtherOccupation.id,
          requiringOccupationType: givenOtherOccupation.occupationType,
          requiredSkillId: givenRequiredSkill_1.id,
          relationType: RelationType.ESSENTIAL,
          signallingValueLabel: SignallingValue.NONE,
        },
      ]);
      // Guard assertion
      expect(actualRelation).toHaveLength(3);
      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<IOccupationDoc>(repository.Model);
      const actualFoundOccupation = (await repository.findById(givenSubject.id)) as IOccupation;

      // THEN expect the subject to be found
      expect(actualFoundOccupation).not.toBeNull();

      // AND to have the given requiredSkill
      expect(actualFoundOccupation.requiresSkills).toEqual(
        expect.arrayContaining<ReferenceWithRelationType<ISkillReference>>([
          expectedRelatedSkillReference(givenRequiredSkill_1, RelationType.ESSENTIAL),
          expectedRelatedSkillReference(givenRequiredSkill_2, RelationType.OPTIONAL),
        ])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(4); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 1  for the relatedSkills and 1 for the related skills references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the requiresSkills
          getExpectedPlan({
            collectionName: repositoryRegistry.occupationToSkillRelation.relationModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              requiringOccupationType: { $eq: givenSubject.occupationType },
              requiringOccupationId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_REQUIRES_SKILLS,
          }),
        ])
      );
      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("Test Occupation hierarchy robustness to inconsistencies", () => {
      test("should ignore children that are not Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-Occupation document is a child of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewESCOOccupationSpec(getMockStringId(1), "occupation_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
        // The non-Occupation in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          parentId: new mongoose.Types.ObjectId(givenOccupation.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: givenOccupation.occupationType,

          //@ts-ignore
          childType: ObjectTypes.Skill, // <- This is the inconsistency
          childDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Child is not an ESCO Occupation or a Local Occupation: ${givenInconsistentPair.childDocModel}`)
        );
      });

      test("should ignore parents that are not ISCO Group | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup or Occupation document is a parent of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewESCOOccupationSpec(getMockStringId(1), "group_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
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
          childType: givenOccupation.occupationType,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parent).toEqual(null);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(
            `Parent is not an ISCOGroup or an ESCO Occupation or a Local Occupation: ${givenInconsistentPair.parentDocModel}`
          )
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: givenOccupation_1.occupationType,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: givenOccupation_2.occupationType,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation_1 by its id
        const actualFoundGroup_1 = await repository.findById(givenOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]);
        expect(actualFoundGroup_1!.parent).toEqual(null);

        // WHEN searching for the Occupation_1 by its id
        const actualFoundGroup_2 = await repository.findById(givenOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parent).toEqual(null);
      });

      test("should not find parent if it is not is the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id),
          parentDocModel: MongooseModelName.Occupation,
          parentType: givenOccupation_1.occupationType,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.Occupation,
          childType: givenOccupation_2.occupationType,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_1 by its id
        jest.spyOn(console, "error");
        const givenFoundGroup_1 = await repository.findById(givenOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(givenFoundGroup_1).not.toBeNull();
        expect(givenFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Child is not in the same model as the parent`));
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const inconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenOccupation_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.Occupation,
          parentType: givenOccupation_1.occupationType,

          childId: new mongoose.Types.ObjectId(givenOccupation_2.id),
          childDocModel: MongooseModelName.Occupation,
          childType: givenOccupation_2.occupationType,
        };
        await repositoryRegistry.occupationHierarchy.hierarchyModel.collection.insertOne(inconsistentPair);

        // WHEN searching for the Occupation_2 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(new Error(`Parent is not in the same model as the child`));
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        ISCOGroup,  3,        ESCO Occupation
        // 1,        2,        ESCO Occupation,  4,       ESCO Occupation
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject occupation O_s with a given ID in the given model
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an ISCOGroup G1 with the same ID as the subject occupation in the given model
        const givenISCOGroupSpecs = getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup");
        // @ts-ignore
        givenISCOGroupSpecs.id = givenID.toHexString();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpecs);
        // guard to ensure the id is the given one
        expect(givenISCOGroup.id).toEqual(givenID.toHexString());

        // AND a second occupation O_1 with some ID  in the given model
        const givenOccupationSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);

        // AND a third occupation O_2 with some ID in the given model
        const givenOccupationSpecs_2 = getSimpleNewESCOOccupationSpec(givenModelId, "occupation_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // AND the ISCOGroup G1 is the parent of O_1
        // AND the subject occupation  is the parent of O_2
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup.id,
            childType: givenOccupation_1.occupationType,
            childId: givenOccupation_1.id,
          },
          {
            parentType: givenSubject.occupationType,
            parentId: givenSubject.id,
            childType: givenOccupation_2.occupationType,
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
        // 1,        2,        ESCO Occupation,  4,       ESCO Occupation
        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject occupation with a given ID in the given model
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND an ISCOGroup with the given ID as the subject occupation in the given model
        const givenISCOGroupSpecs_2 = getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup 2");
        // @ts-ignore
        givenISCOGroupSpecs_2.id = givenID.toHexString();
        const givenISCOGroup_2 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpecs_2);
        // guard to ensure the id is the given one
        expect(givenISCOGroup_2.id).toEqual(givenID.toHexString());

        // AND another ISCOGroup with some ID in the given model
        const givenISCOGroupSpec_1 = getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup 1");
        const givenISCOGroup_1 = await repositoryRegistry.ISCOGroup.create(givenISCOGroupSpec_1);

        // AND another occupation with some ID in the given model
        const givenOccupationSpecs_1 = getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);

        // AND the ISCOGroup 1 is the parent of ISCOGroup 2
        // AND the Occupation 1 is the parent of the subject occupation
        const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.ISCOGroup,
            parentId: givenISCOGroup_1.id,
            childType: ObjectTypes.ISCOGroup,
            childId: givenISCOGroup_2.id,
          },
          {
            parentType: givenOccupation_1.occupationType,
            parentId: givenOccupation_1.id,
            childType: givenSubject.occupationType,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only occupation 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parent).toEqual(expectedOccupationReference(givenOccupation_1));
      });
    });

    test("should return the Occupation with its related skills", async () => {
      // GIVEN an Occupation exists in the database and two  skills in the same model
      const givenModelId = getMockStringId(1);
      // The subject (Occupation)
      const givenSubjectSpecs = getSimpleNewESCOOccupationSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The first skill
      const givenSkillSpecs_1: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_1");
      const givenSkill_1 = await repositoryRegistry.skill.create(givenSkillSpecs_1);
      // The second skill
      const givenSkillSpecs_2: INewSkillSpec = getSimpleNewSkillSpec(givenModelId, "skill_2");
      const givenSkill_2 = await repositoryRegistry.skill.create(givenSkillSpecs_2);

      // AND the subject Occupation has two skills
      const actualRequiresSkills = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, [
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: givenSubject.occupationType,
          requiredSkillId: givenSkill_1.id,
          relationType: RelationType.ESSENTIAL,
          signallingValueLabel: SignallingValue.NONE,
        },
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: givenSubject.occupationType,
          requiredSkillId: givenSkill_2.id,
          relationType: RelationType.OPTIONAL,
          signallingValueLabel: SignallingValue.NONE,
        },
      ]);

      // Guard assertion
      expect(actualRequiresSkills).toHaveLength(2);

      // WHEN searching for the subject by its id
      const actualFoundOccupation = (await repository.findById(givenSubject.id)) as IOccupation;

      // THEN expect the subject to be found
      expect(actualFoundOccupation).not.toBeNull();

      // AND to have the given skills
      expect(actualFoundOccupation.requiresSkills).toEqual(
        expect.arrayContaining([
          expectedRelatedSkillReference(givenSkill_1, RelationType.ESSENTIAL),
          expectedRelatedSkillReference(givenSkill_2, RelationType.OPTIONAL),
        ])
      );

      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("test Occupation to Skill relations robustness to inconsistencies", () => {
      test("should ignore requiresSkills that are not Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-Skill document has a requiresSkill relation with an occupation
        const givenOccupationSpecs = getNewESCOOccupationSpec();
        const givenOccupation = await repository.create(givenOccupationSpecs);

        // The non-Skill in this case an ISCOGroup
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: givenOccupation.occupationType,
          requiringOccupationDocModel: MongooseModelName.Occupation,

          requiredSkillId: new mongoose.Types.ObjectId(givenISCOGroup.id), // <- This is the inconsistency
          //@ts-ignore
          requiredSkillDocModel: MongooseModelName.ISCOGroup, // <- This is the inconsistency
        };
        await repositoryRegistry.occupationToSkillRelation.relationModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundOccupation = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent requiresSkill
        expect(actualFoundOccupation).not.toBeNull();
        expect(actualFoundOccupation!.requiresSkills).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          new Error(`Object is not a Skill: ${givenInconsistentPair.requiredSkillDocModel}`)
        );
      });

      test("should not find requiresSkills if the relation is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the requiringOccupation and requiredSkills are in a different model than the relation

        const givenOccupationSpecs = getNewESCOOccupationSpec();
        const givenOccupation = await repository.create(givenOccupationSpecs);
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenSkillSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockStringId(3);

        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <- This is the inconsistency

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: givenOccupation.occupationType,
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
        // GIVEN an inconsistency was introduced, and the requiredSkill and the requiringOccupation are in different models

        const givenOccupationSpecs = getNewESCOOccupationSpec();
        const givenOccupation = await repository.create(givenOccupationSpecs);
        const givenSkillSpecs = getNewSkillSpec();
        givenSkillSpecs.modelId = getMockStringId(99); // <-- this is the inconsistency
        const givenSkill = await repositoryRegistry.skill.create(givenSkillSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        //@ts-ignore
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: givenOccupation.occupationType,
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
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.occupation.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    describe.each([
      ["no filter", undefined, () => true, { queryFilter: {}, usedIndex: INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE }],
      [
        "filter with undefined occupationType",
        { occupationType: undefined },
        () => true,
        {
          queryFilter: {},
          usedIndex: INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE, // HERE any index is that starts with modelId could be used
        },
      ],
      [
        "ESCO Occupations",
        { occupationType: ObjectTypes.ESCOOccupation } as SearchFilter,
        (occupation: IOccupation) => occupation.occupationType === ObjectTypes.ESCOOccupation,
        {
          queryFilter: { occupationType: { $eq: ObjectTypes.ESCOOccupation } },
          usedIndex: INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE,
        },
      ],
      [
        "Local Occupations",
        { occupationType: ObjectTypes.LocalOccupation } as SearchFilter,
        (occupation: IOccupation) => occupation.occupationType === ObjectTypes.LocalOccupation,
        {
          queryFilter: { occupationType: { $eq: ObjectTypes.LocalOccupation } },
          usedIndex: INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE,
        },
      ],
    ])(
      "Test findAll() for %s",
      (
        caseDescription: string,
        givenFilter: SearchFilter | undefined,
        assertionFilter: (_occupation: IOccupation) => boolean,
        expectedPlan: { queryFilter: mongoose.FilterQuery<IOccupationDoc>; usedIndex: mongoose.IndexDefinition }
      ) => {
        test(`should find all ${caseDescription} in the correct model`, async () => {
          // Given some modelId
          const givenModelId = getMockStringId(1);
          // AND a set of Occupations exist in the database for a given Model
          const givenOccupations = await createOccupationsInDB(givenModelId);
          // AND some other Occupations exist in the database for a different model
          const givenModelId_other = getMockStringId(2);
          await createOccupationsInDB(givenModelId_other);

          // WHEN searching for all occupations in the given model with a given filter
          // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
          const actualPlans = setUpFindWithExplain<IOccupationDoc>(repository.Model);
          const actualOccupations = repository.findAll(givenModelId, givenFilter);

          // THEN the occupations should be returned as a consumable stream that emits all occupations
          const actualOccupationsArray: IOccupation[] = [];
          for await (const data of actualOccupations) {
            actualOccupationsArray.push(data);
          }
          const expectedOccupations = givenOccupations.filter(assertionFilter).map((occupation) => {
            const { parent, children, requiresSkills, ...occupationData } = occupation;
            return occupationData;
          });
          expect(actualOccupationsArray).toIncludeSameMembers(expectedOccupations);
          // AND expect the populate query plan to use the correct indexes
          await expect(actualPlans).resolves.toHaveLength(1); // 1 for the search
          await expect(actualPlans).resolves.toEqual(
            expect.arrayContaining([
              getExpectedPlan({
                collectionName: repository.Model.collection.name,
                filter: {
                  modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
                  ...expectedPlan.queryFilter,
                },
                usedIndex: expectedPlan.usedIndex,
              }),
            ])
          );
        });

        test(`should not return any ${caseDescription} when the model does not have any and other models have`, async () => {
          // GIVEN no Occupations exist in the database for the given model
          const givenModelId = getMockStringId(1);
          const givenModelId_other = getMockStringId(2);
          // BUT some other Occupations exist in the database for a different model
          await createOccupationsInDB(givenModelId_other);

          // WHEN the findAll method is called for occupations
          // @ts-ignore
          const actualStream = repository.findAll(givenModelId, givenFilter);

          // THEN the stream should end without emitting any data
          const receivedData: IOccupation[] = [];
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

          // THEN the findAll method should throw an error for occupations
          // @ts-ignore
          expect(() => repository.findAll(givenModelId, givenFilter)).toThrow(
            expect.toMatchErrorWithCause("OccupationRepository.findAll: findAll failed", givenError.message)
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

          // WHEN searching for all occupations in the given model of a given type
          // @ts-ignore
          const actualOccupations = repository.findAll(getMockStringId(1), givenFilter);

          // THEN the occupations should be returned as a consumable stream that emits an error and ends
          const actualOccupationsArray: IOccupation[] = [];
          await expect(async () => {
            for await (const data of actualOccupations) {
              actualOccupationsArray.push(data);
            }
          }).rejects.toThrowError(givenError);
          expect(console.error).toHaveBeenCalledWith(
            expect.toMatchErrorWithCause("OccupationRepository.findAll: stream failed", givenError.message)
          );
          expect(actualOccupations.closed).toBeTruthy();
          expect(actualOccupationsArray).toHaveLength(0);
          mockFind.mockRestore();
        });

        TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
          //@ts-ignore
          repositoryRegistry.occupation.findAll(getMockStringId(1), givenFilter)
        );
      }
    );

    // should throw an error if occupationType is not ESCO or LOCAL
    test("should throw an error if occupationType is not valid", async () => {
      // GIVEN no Occupations exist in the database for the given model
      const givenModelId = getMockStringId(1);

      // WHEN the findAll method is called for occupations
      expect(() =>
        repository.findAll(
          givenModelId,
          // @ts-ignore
          { occupationType: ObjectTypes.ISCOGroup }
        )
      ).toThrowError("OccupationRepository.findAll: findAll failed. OccupationType must be either ESCO or LOCAL.");
    });
  });
});
