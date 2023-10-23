// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockId } from "_test_utilities/mockMongoId";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { generateRandomUrl, getTestString } from "_test_utilities/specialCharacters";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { ISkillRepository } from "./SkillRepository";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { INewSkillSpec, ISkill } from "./skills.types";
import { TestDBConnectionFailureNoSetup } from "_test_utilities/testDBConnectionFaillure";
import { ISkillHierarchyPairDoc } from "../skillHierarchy/skillHierarchy.types";
import { ObjectTypes } from "../common/objectTypes";
import { MongooseModelName } from "../common/mongooseModelNames";
import { INewISCOGroupSpec } from "../iscoGroup/ISCOGroup.types";
import { getSimpleNewISCOGroupSpec, getSimpleNewSkillGroupSpec } from "../_test_utilities/mockData";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an INewSkillSpec with random values,
 * that can be used for creating a new ISkill
 */
function getNewSkillSpec(): INewSkillSpec {
  return {
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockId(2),
    originUUID: randomUUID(),
    ESCOUri: generateRandomUrl(),
    definition: getTestString(DEFINITION_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    skillType: "knowledge",
    reuseLevel: "cross-sector",
    altLabels: [getTestString(LABEL_MAX_LENGTH, "1_"), getTestString(LABEL_MAX_LENGTH, "2_")],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an expected INewSkillSpec from a given INewSkillSpec,
 * that can ebe used for assertions
 * @param givenSpec
 */
function expectedFromGivenSpec(givenSpec: INewSkillSpec): ISkill {
  return {
    ...givenSpec,
    id: expect.any(String),
    UUID: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    parents: [],
    children: [],
  };
}

describe("Test the Skill Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: ISkillRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skill;
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

  test("initOnce has registered the SkillRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the modelInfo repository to be defined
    expect(getRepositoryRegistry().skill).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test create() skill", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a new skill", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with the given specifications
      const actualNewSkill = await repository.create(givenNewSkillSpec);

      // THEN expect the new skill to be created with the specific attributes
      const expectedNewSkill: ISkill = expectedFromGivenSpec(givenNewSkillSpec);
      expect(actualNewSkill).toEqual(expectedNewSkill);
    });

    test("should reject with an error when creating a skill and providing a UUID", async () => {
      // GIVEN a valid newSkillSpec
      const givenNewSkillSpec: INewSkillSpec = getNewSkillSpec();

      // WHEN Creating a new skill with the given specifications by providing a UUID
      const actualPromise = repository.create({
        ...givenNewSkillSpec,
        //@ts-ignore
        UUID: randomUUID(),
      });

      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/UUID should not be provided/);
    });

    test("should reject with an error when creating skill with an existing UUID", async () => {
      // GIVEN a Skill record exists in the database
      const givenNewSkillSpecSpec: INewSkillSpec = getNewSkillSpec();
      const givenNewModel = await repository.create(givenNewSkillSpecSpec);

      // WHEN Creating a new Skill with the UUID of the existing Skill
      // @ts-ignore
      randomUUID.mockReturnValueOnce(givenNewModel.UUID);
      const actualPromise = repository.create(givenNewSkillSpecSpec);

      // THEN expect the actual promise to reject
      await expect(actualPromise).rejects.toThrowError(/duplicate key/);
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.create(getNewSkillSpec());
    });
  });

  describe("Test createMany() Skill ", () => {
    afterEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    beforeEach(async () => {
      await repository.Model.deleteMany({}).exec();
    });

    test("should successfully create a batch of new Skills", async () => {
      // GIVEN some valid SkillSpec
      const givenBatchSize = 3;
      const givenNewSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillSpecs[i] = getNewSkillSpec();
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenNewSkillSpecs);

      // THEN expect all the Skills to be created with the specific attributes
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenNewSkillSpecs.map((givenNewSkillSpec) => {
            return expectedFromGivenSpec(givenNewSkillSpec);
          })
        )
      );
    });

    test("should successfully create a batch of new Skills even if some don't validate", async () => {
      // GIVEN two valid skillSpecs
      const givenValidSkillSpecs: INewSkillSpec[] = [getNewSkillSpec(), getNewSkillSpec()];
      // AND two SkillSpec that is invalid
      const givenInvalidSkillSpec: INewSkillSpec[] = [getNewSkillSpec(), getNewSkillSpec()];
      givenInvalidSkillSpec[0].preferredLabel = ""; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidSkillSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany([
        givenValidSkillSpecs[0],
        ...givenInvalidSkillSpec,
        givenValidSkillSpecs[1],
      ]);

      // THEN expect only the valid Skills to be created
      expect(actualNewSkills).toHaveLength(givenValidSkillSpecs.length);
      expect(actualNewSkills).toEqual(
        expect.arrayContaining(
          givenValidSkillSpecs.map((givenNewSkillSpec) => {
            return expectedFromGivenSpec(givenNewSkillSpec);
          })
        )
      );
    });

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillSpec
      const givenBatchSize = 3;
      const givenInValidSkillSpecs: INewSkillSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenInValidSkillSpecs[i] = getNewSkillSpec();
        givenInValidSkillSpecs[i].preferredLabel = "";
      }

      // WHEN creating the batch of skills with the given specifications
      const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenInValidSkillSpecs);

      // THEN expect no skill to be created
      expect(actualNewSkills).toHaveLength(0);
    });

    describe("Test unique indexes", () => {
      test("should return only the documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 SkillSpecs
        const givenBatchSize = 3;
        const givenNewSkillSpecs: INewSkillSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillSpecs[i] = getNewSkillSpec();
        }

        // WHEN creating the batch of skills with the given specifications (the second SkillSpec having the same UUID as the first one)
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewSkills: INewSkillSpec[] = await repository.createMany(givenNewSkillSpecs);

        // THEN expect only the first and the third Skill to be created with the specific attributes
        expect(actualNewSkills).toEqual(
          expect.arrayContaining(
            givenNewSkillSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewSkillSpec) => {
                return expectedFromGivenSpec(givenNewSkillSpec);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.createMany([getNewSkillSpec()]);
    });
  });

  describe("Test findById()", () => {
    test("should find a Skill by its id", async () => {
      // GIVEN a Skill exists in the database
      const givenSkillSpecs = getNewSkillSpec();
      const givenSkill = await repository.create(givenSkillSpecs);

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById(givenSkill.id);

      // THEN expect the Skill to be found
      expect(actualFoundSkill).toEqual(givenSkill);
    });

    test("should return null if no Skill with the given id exists", async () => {
      // GIVEN no Skill exists in the database

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no Skill to be found
      expect(actualFoundSkill).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no Skill exists in the database

      // WHEN searching for the Skill by its id
      const actualFoundSkill = await repository.findById("non_existing_id");

      // THEN expect no Skill to be found
      expect(actualFoundSkill).toBeNull();
    });

    test.todo("should return the skill with its parent and children");

    test.todo("should return the skill with its related skills");

    test.todo("should return the skill with its related occupations");

    describe("Test Skill robustness to inconsistencies", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });
      test("should ignore parents that are not SkillGroups or Skills", async () => {
        // GIVEN an inconsistency was introduced, and a document that is not either a SkillGroup or a Skill is a parent of a Skill
        // The Skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        // The non-SkillGroup in this case an ISCO group
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          //@ts-ignore
          parentType: ObjectTypes.ISCOGroup, // <- This is the inconsistency
          parentDocModel: MongooseModelName.ISCOGroup, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenISCOGroup.id), // <- This is the inconsistency

          childType: ObjectTypes.Skill,
          childDocModel: MongooseModelName.Skill,
          childId: new mongoose.Types.ObjectId(givenSkill.id),

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent parent
        expect(actualFoundSkill!.parents).toEqual([]);
      });

      test("should ignore parents that are not in the same model as the skill", async () => {
        // GIVEN an inconsistency was introduced, and the parent and the skill are in different models
        // The Skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockId(1), "group_1");
        const givenSkillGroup = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs);
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkill.id),
          childDocModel: MongooseModelName.Skill,
          childType: ObjectTypes.Skill,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent parent
        expect(actualFoundSkill!.parents).toEqual([]);
      });

      test("should ignore children that are not SkillGroups or Skills", async () => {
        // GIVEN an inconsistency was introduced, and a document that is not either a SkillGroup or a Skill is a child of a Skill
        // The Skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        // The non-SkillGroup in this case an ISCO group
        const givenNewISCOGroupSpec: INewISCOGroupSpec = getSimpleNewISCOGroupSpec(getMockId(1), "group_1");
        const givenISCOGroup = await repositoryRegistry.ISCOGroup.create(givenNewISCOGroupSpec);
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkill.id),
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          childId: new mongoose.Types.ObjectId(givenISCOGroup.id), // <- This is the inconsistency
          childDocModel: MongooseModelName.ISCOGroup, // <- This is the inconsistency
          //@ts-ignore
          childType: ObjectTypes.ISCOGroup, // <- This is the inconsistency

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent child
        expect(actualFoundSkill!.children).toEqual([]);
      });

      test("should ignore children that are not in the same model as the skill", async () => {
        // GIVEN an inconsistency was introduced, and the child and the skill are in different models
        // The Skill
        const givenSkillSpecs = getNewSkillSpec();
        const givenSkill = await repository.create(givenSkillSpecs);
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockId(1), "group_1");
        const givenSkillGroup = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs);
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkill.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkill.id),
          parentDocModel: MongooseModelName.Skill,
          parentType: ObjectTypes.Skill,

          childId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the Skill by its id
        const actualFoundSkill = await repository.findById(givenSkill.id);

        // THEN expect the Skill to not contain the inconsistent child
        expect(actualFoundSkill!.children).toEqual([]);
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skill.findById(getMockId(1));
    });
  });
});
