// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { IOccupationRepository } from "./occupationRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { INewOccupationSpec, IOccupation, IOccupationReference } from "./occupation.types";
import { INewSkillSpec, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes, OccupationType, RelationType } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  getNewISCOGroupSpec,
  getNewOccupationSpec,
  getNewSkillSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewOccupationSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import {
  expectedISCOGroupReference,
  expectedOccupationReference,
  expectedRelatedSkillReference,
} from "esco/_test_utilities/expectedReference";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

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
 */
function expectedFromGivenSpec(givenSpec: INewOccupationSpec): IOccupation {
  return {
    ...givenSpec,
    parent: null,
    children: [],
    requiresSkills: [],
    id: expect.any(String),
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
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
    test("should successfully create a new Occupation", async () => {
      // GIVEN a valid OccupationSpec
      const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();

      // WHEN Creating a new occupation with given specifications
      const actualNewOccupation: INewOccupationSpec = await repository.create(givenNewOccupationSpec);

      // THEN expect the new occupation to be created with the specific attributes
      const expectedNewISCO: IOccupation = expectedFromGivenSpec(givenNewOccupationSpec);
      expect(actualNewOccupation).toEqual(expectedNewISCO);
    });

    test("should successfully create a new LocalOccupation", async () => {
      // GIVEN a valid OccupationSpec
      const givenNewLocalOccupationSpec: INewOccupationSpec = getNewOccupationSpec(true);

      // WHEN Creating a new occupation with given specifications
      const actualNewLocalOccupation: INewOccupationSpec = await repository.create(givenNewLocalOccupationSpec);

      // THEN expect the new occupation to be created with the specific attributes
      const expectedNewISCO: IOccupation = expectedFromGivenSpec(givenNewLocalOccupationSpec);
      expect(actualNewLocalOccupation).toEqual(expectedNewISCO);
    });

    test("should reject with an error when creating a model and providing a UUID", async () => {
      // GIVEN a OccupationSpec that is otherwise valid but has a UUID
      const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();

      // WHEN Creating a new Occupation with a provided UUID
      const actualNewOccupationPromise = repository.create({
        ...givenNewOccupationSpec,
        //@ts-ignore
        UUID: randomUUID(),
      });

      // Then expect the promise to reject with an error
      await expect(actualNewOccupationPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    describe("Test unique indexes", () => {
      test("should reject with an error when creating model with an existing UUID", async () => {
        // GIVEN an Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenNewOccupation = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same UUID as the one the existing Occupation
        // @ts-ignore
        randomUUID.mockReturnValueOnce(givenNewOccupation.UUID);
        const actualSecondNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const actualSecondNewOccupationPromise = repository.create(actualSecondNewOccupationSpec);

        // THEN expect it to throw an error
        await expect(actualSecondNewOccupationPromise).rejects.toThrowError(/duplicate key .* dup key: { UUID/);
      });

      test("should successfully create a second Identical Occupation in a different model", async () => {
        // GIVEN an Occupation record exists in the database
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
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
        const givenNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        const givenNewModel = await repository.create(givenNewOccupationSpec);

        // WHEN Creating a new Occupation with the same pair of modelId and code as the ones the existing Occupation
        // @ts-ignore
        const actualSecondNewOccupationSpec: INewOccupationSpec = getNewOccupationSpec();
        actualSecondNewOccupationSpec.code = givenNewModel.code;
        actualSecondNewOccupationSpec.modelId = givenNewModel.modelId;
        const actualSecondNewModelPromise = repository.create(actualSecondNewOccupationSpec);

        // THEN expect it to throw an error
        await expect(actualSecondNewModelPromise).rejects.toThrowError(/duplicate key error collection/);
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.occupation.create(getNewOccupationSpec());
    });
  });

  describe("Test createMany() Occupation ", () => {
    test("should successfully create a batch of new Occupations", async () => {
      // GIVEN some valid OccupationSpec
      const givenBatchSize = 3;
      const givenNewOccupationSpecs: INewOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewOccupationSpecs[i] = getNewOccupationSpec();
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);

      // THEN expect all the ISCOGroups to be created with the specific attributes
      expect(actualNewOccupations).toEqual(
        expect.arrayContaining(
          givenNewOccupationSpecs.map((givenNewOccupationSpec) => {
            return expectedFromGivenSpec(givenNewOccupationSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new Occupations even if some don't validate", async () => {
      // GIVEN two valid OccupationSpec
      const givenValidOccupationSpecs: INewOccupationSpec[] = [getNewOccupationSpec(), getNewOccupationSpec()];
      // AND two OccupationSpec that is invalid
      const givenInvalidOccupationSpec: INewOccupationSpec[] = [getNewOccupationSpec(), getNewOccupationSpec()];
      givenInvalidOccupationSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidOccupationSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of ISCOGroups with the given specifications
      const actualNewOccupations: INewOccupationSpec[] = await repository.createMany([
        givenValidOccupationSpecs[0],
        ...givenInvalidOccupationSpec,
        givenValidOccupationSpecs[1],
      ]);

      // THEN expect only the valid ISCOGroup to be created
      expect(actualNewOccupations).toHaveLength(givenValidOccupationSpecs.length);
      expect(actualNewOccupations).toEqual(
        expect.arrayContaining(
          givenValidOccupationSpecs.map((givenNewOccupationSpec) => {
            return expectedFromGivenSpec(givenNewOccupationSpec);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the elements could be validated", async () => {
      // GIVEN only invalid OccupationSpec
      const givenBatchSize = 3;
      const givenValidOccupationSpecs: INewOccupationSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidOccupationSpecs[i] = getNewOccupationSpec();
        givenValidOccupationSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of ISCOGroups with the given specifications
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
          givenNewOccupationSpecs[i] = getNewOccupationSpec();
        }

        // WHEN creating the batch of skills Groups with the given specifications (the second SkillGroupSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs
              .filter((_, index) => index !== 1)
              .map((givenNewOccupationSpec) => {
                return expectedFromGivenSpec(givenNewOccupationSpec);
              })
          )
        );
      });

      test("should return only the documents that did not violate the (modelId and code) unique index", async () => {
        // GIVEN 3 OccupationSpec
        const givenBatchSize = 3;
        const givenNewOccupationSpecs: INewOccupationSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewOccupationSpecs[i] = getNewOccupationSpec();
        }

        // WHEN creating the batch of skills Groups with the given specifications (the second SkillGroupSpec having the same UUID as the first one)
        givenNewOccupationSpecs[1].code = givenNewOccupationSpecs[0].code;
        const actualNewOccupations: INewOccupationSpec[] = await repository.createMany(givenNewOccupationSpecs);

        // THEN expect only the first and the third the ISCOGroups to be created with the specific attributes
        expect(actualNewOccupations).toEqual(
          expect.arrayContaining(
            givenNewOccupationSpecs
              .filter((_, index) => index !== 1)
              .map((givenNewOccupationSpec) => {
                return expectedFromGivenSpec(givenNewOccupationSpec);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.occupation.createMany([getNewOccupationSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find an Occupation by its id", async () => {
      // GIVEN an Occupation exists in the database
      const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockStringId(1), "occupation_1");
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
      const givenSubjectSpecs = getSimpleNewOccupationSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (ISCO Group)
      const givenParentSpecs = getSimpleNewISCOGroupSpec(givenModelId, "parent");
      const givenParent = await repositoryRegistry.ISCOGroup.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject Occupation has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.ISCOGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.Occupation,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenSubject.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenSubject.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
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

      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    test("should return the Occupation with its parent(Occupation) and children (Occupations)", async () => {
      // GIVEN four Occupations in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (Occupation)
      const givenSubjectSpecs = getSimpleNewOccupationSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (Occupation)
      const givenParentSpecs = getSimpleNewOccupationSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);

      // The child Occupation
      const givenChildSpecs_1 = getSimpleNewOccupationSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Occupation
      const givenChildSpecs_2 = getSimpleNewOccupationSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.occupation.create(givenChildSpecs_2);

      // AND the subject Occupation has a parent and two children
      const actualHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
        {
          // parent of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenParent.id,
          childType: ObjectTypes.Occupation,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenSubject.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.Occupation,
          parentId: givenSubject.id,
          childType: ObjectTypes.Occupation,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the subject by its id
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

      // AND no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("Test Occupation hierarchy robustness to inconsistencies", () => {
      test("should ignore children that are not Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-Occupation document is a child of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockStringId(1), "occupation_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
        // The non-Occupation in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenOccupation.modelId,
          originUUID: "",
          ESCOUri: "",
          definition: "",
          description: "",
          scopeNote: "",
          skillType: SkillType.Knowledge,
          reuseLevel: ReuseLevel.CrossSector,
          altLabels: [],
          importId: "",
        };
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

        // WHEN searching for the Occupation by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenOccupation.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect a warning to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not an Occupation: ${givenInconsistentPair.childDocModel}`);
      });

      test("should ignore parents that are not ISCO Group | Occupations", async () => {
        // GIVEN an inconsistency was introduced, and non-ISCOGroup or Occupation document is a parent of an Occupation
        // The Occupation
        const givenOccupationSpecs = getSimpleNewOccupationSpec(getMockStringId(1), "group_1");
        const givenOccupation = await repository.create(givenOccupationSpecs);
        // The non-Occupation in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = {
          preferredLabel: "skill_1",
          modelId: givenOccupation.modelId,
          originUUID: "",
          ESCOUri: "",
          definition: "",
          description: "",
          scopeNote: "",
          skillType: SkillType.Knowledge,
          reuseLevel: ReuseLevel.CrossSector,
          altLabels: [],
          importId: "",
        };
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: IOccupationHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),
          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenOccupation.id),
          childDocModel: MongooseModelName.Occupation,
          childType: ObjectTypes.Occupation,
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
          `Parent is not an ISCOGroup or an Occupation: ${givenInconsistentPair.parentDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
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
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

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

        // WHEN searching for the Occupation_1 by its id
        jest.spyOn(console, "error");
        const givenFoundGroup_1 = await repository.findById(givenOccupation_1.id);

        // THEN expect the Occupation to not contain the inconsistent children
        expect(givenFoundGroup_1).not.toBeNull();
        expect(givenFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The Occupation 1
        const givenModelId_1 = getMockStringId(1);
        const givenOccupationSpecs_1 = getSimpleNewOccupationSpec(givenModelId_1, "group_1");
        const givenOccupation_1 = await repository.create(givenOccupationSpecs_1);
        // The Occupation 2
        const givenModelId_2 = getMockStringId(2);
        const givenOccupationSpecs_2 = getSimpleNewOccupationSpec(givenModelId_2, "group_2");
        const givenOccupation_2 = await repository.create(givenOccupationSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

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

        // WHEN searching for the Occupation_2 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenOccupation_2.id);

        // THEN expect the Occupation to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parent).toEqual(null); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });
    });

    test("should return the Occupation with its related skills", async () => {
      // GIVEN an Occupation exists in the database and two  skills in the same model
      const givenModelId = getMockStringId(1);
      // The subject (Occupation)
      const givenSubjectSpecs = getSimpleNewOccupationSpec(givenModelId, "subject");
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
          requiringOccupationType: OccupationType.ESCO,
          requiredSkillId: givenSkill_1.id,
          relationType: RelationType.ESSENTIAL,
        },
        {
          requiringOccupationId: givenSubject.id,
          requiringOccupationType: OccupationType.ESCO,
          requiredSkillId: givenSkill_2.id,
          relationType: RelationType.OPTIONAL,
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
        const givenOccupationSpecs = getNewOccupationSpec();
        const givenOccupation = await repository.create(givenOccupationSpecs);

        // The non-Skill in this case an ISCOGroup
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getNewISCOGroupSpec();
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenOccupation.modelId),

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.ESCO,
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
        expect(console.error).toBeCalledWith(`Object is not a Skill: ${givenInconsistentPair.requiredSkillDocModel}`);
      });

      test("should not find requiresSkills if the relation is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the requiringOccupation and requiredSkills are in a different model than the relation

        const givenOccupationSpecs = getNewOccupationSpec();
        const givenOccupation = await repository.create(givenOccupationSpecs);
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repositoryRegistry.skill.create(givenSkillSpecs);

        // it is important to cast the id to ObjectId, otherwise the requiredSkills will not be found
        const givenModelId_3 = getMockStringId(3);

        const givenInconsistentPair: IOccupationToSkillRelationPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <- This is the inconsistency

          relationType: RelationType.ESSENTIAL,
          requiringOccupationId: new mongoose.Types.ObjectId(givenOccupation.id),
          requiringOccupationType: OccupationType.ESCO,
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

        const givenOccupationSpecs = getNewOccupationSpec();
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
          requiringOccupationType: OccupationType.ESCO,
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
      return repositoryRegistry.occupation.findById(getMockStringId(1));
    });
  });
});
