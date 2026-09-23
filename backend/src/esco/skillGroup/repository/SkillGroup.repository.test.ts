// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import mongoose, { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { ISkillGroupRepository } from "../repository/SkillGroup.repository";
import {
  INewSkillGroupSpec,
  INewSkillGroupSpecLocalized,
  INewSkillGroupSpecWithoutImportId,
  ISkillGroup,
  ISkillGroupDoc,
  ISkillGroupReference,
  IPartialUpdateSkillGroupSpec,
  IUpdateSkillGroupSpec,
} from "../_shared/skillGroup.types";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { INewSkillSpec, ISkillReference } from "esco/skill/_shared/skill.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { INewOccupationGroupSpec } from "esco/occupationGroup/_shared/OccupationGroup.types";
import {
  getNewSkillGroupSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
  getNewSkillGroupSpecWithoutImportId,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailureNoSetup,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedSkillGroupReference, expectedSkillReference } from "esco/_test_utilities/expectedReference";
import { Readable } from "node:stream";
import {
  getExpectedPlan,
  setUpFindWithExplain,
  setUpPopulateWithExplain,
} from "esco/_test_utilities/queriesWithExplainPlan";
import { INDEX_FOR_CHILDREN, INDEX_FOR_PARENTS } from "esco/skillHierarchy/skillHierarchyModel";
import { generateRandomUUIDs } from "_test_utilities/generateRandomUUIDs";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID),
  };
});

/**
 * Helper function to create an expected ISkillGroup from a given ,
 * that can ebe used for assertions
 * @param givenSpec
 * @param newUUID
 */
function expectedFromGivenSpec(givenSpec: INewSkillGroupSpec, newUUID: string): ISkillGroup {
  return {
    children: [],
    parents: [],
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

function expectedFromGivenSpecWithoutImportId(
  givenSpec: INewSkillGroupSpecWithoutImportId,
  newUUID: string
): ISkillGroup {
  return {
    children: [],
    parents: [],
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    importId: expect.toBeNil(),
  };
}

function getNewSkillGroupSpecLocalized(overrides?: Partial<INewSkillGroupSpecLocalized>): INewSkillGroupSpecLocalized {
  const fallbackKey = getFallbackLanguageConfig().dbKeyName;
  return {
    code: getTestSkillGroupCode(100),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    originUri: "",
    preferredLabel: new Map([[fallbackKey, "preferred label"]]) as INewSkillGroupSpecLocalized["preferredLabel"],
    altLabels: [
      new Map([[fallbackKey, "alt label 1"]]),
      new Map([[fallbackKey, "alt label 2"]]),
    ] as INewSkillGroupSpecLocalized["altLabels"],
    description: new Map([[fallbackKey, "description"]]) as INewSkillGroupSpecLocalized["description"],
    scopeNote: new Map([[fallbackKey, "scope note"]]) as INewSkillGroupSpecLocalized["scopeNote"],
    importId: getMockStringId(Math.floor(Math.random() * 1000)),
    ...overrides,
  };
}

function expectedFromGivenLocalizedSpec(givenSpec: INewSkillGroupSpecLocalized, newUUID: string): ISkillGroup {
  const fallbackKey = getFallbackLanguageConfig().dbKeyName as Parameters<
    INewSkillGroupSpecLocalized["preferredLabel"]["get"]
  >[0];
  return {
    children: [],
    parents: [],
    ...givenSpec,
    id: expect.any(String),
    UUID: newUUID,
    UUIDHistory: [newUUID, ...givenSpec.UUIDHistory],
    preferredLabel: givenSpec.preferredLabel.get(fallbackKey) ?? "",
    altLabels: givenSpec.altLabels.map((m) => m.get(fallbackKey) ?? ""),
    description: givenSpec.description.get(fallbackKey) ?? "",
    scopeNote: givenSpec.scopeNote.get(fallbackKey) ?? "",
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };
}

describe("Test the SkillGroup Repository with an in-memory mongodb", () => {
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
    // reset the mock implementation of Model.find that might have been set up by setUpFindWithExplain()
    jest.spyOn(mongoose.Model, "find").mockRestore();
    //---
  });

  let dbConnection: Connection;
  let repository: ISkillGroupRepository;
  let repositoryRegistry: RepositoryRegistry;

  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillGroup;
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  /** Helper function to create n simple SkillGroups in the db,
   * @param modelId
   * @param batchSize
   */
  async function createSkillGroupsInDB(modelId: string, batchSize: number = 3) {
    const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      givenNewSkillGroupSpecs.push(getSimpleNewSkillGroupSpec(modelId, `skillGroup_${i}`));
    }
    return await repository.createMany(givenNewSkillGroupSpecs);
  }

  async function cleanupDBCollections() {
    if (repository) await repository.Model.deleteMany({}).exec();
    if (repositoryRegistry) {
      await repositoryRegistry.OccupationGroup.Model.deleteMany({}).exec();
      await repositoryRegistry.skill.Model.deleteMany({}).exec();
      await repositoryRegistry.skillHierarchy.hierarchyModel.deleteMany({}).exec();
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
    test("should successfully create a new skill group", async () => {
      // GIVEN a valid SkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpecWithoutImportId = getNewSkillGroupSpecWithoutImportId();

      // WHEN Creating a new skillGroup with given specifications
      const actualNewModel = await repository.create(givenNewSkillGroupSpec);

      // THEN expect the new skillGroup to be created with the specific attributes
      const expectedNewSkillGroup: ISkillGroup = expectedFromGivenSpecWithoutImportId(
        givenNewSkillGroupSpec,
        actualNewModel.UUID
      );
      expect(actualNewModel).toEqual(expectedNewSkillGroup);
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a new skill group when the given specifications have a UUIDHistory with %i items",
      async (count: number) => {
        // GIVEN a valid SkillGroupSpec
        const givenNewSkillGroupSpec: INewSkillGroupSpecWithoutImportId = getNewSkillGroupSpecWithoutImportId();
        givenNewSkillGroupSpec.UUIDHistory = generateRandomUUIDs(count);

        // WHEN Creating a new skillGroup with given specifications
        const actualNewModel = await repository.create(givenNewSkillGroupSpec);

        // THEN expect the new skillGroup to be created with the specific attributes
        const expectedNewSkillGroup: ISkillGroup = expectedFromGivenSpecWithoutImportId(
          givenNewSkillGroupSpec,
          actualNewModel.UUID
        );
        expect(actualNewModel).toEqual(expectedNewSkillGroup);
      }
    );

    test("should reject with an error when creating a skill group and providing a UUID", async () => {
      // GIVEN a valid newSkillGroupSpec
      const givenNewSkillGroupSpec: INewSkillGroupSpecWithoutImportId = getNewSkillGroupSpecWithoutImportId();

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
        const givenNewSkillGroupSpecSpec: INewSkillGroupSpecWithoutImportId = getNewSkillGroupSpecWithoutImportId();
        const givenNewModel = await repository.create(givenNewSkillGroupSpecSpec);

        // WHEN Creating a new SkillGroup with the UUID of the existing SkillGroup
        (randomUUID as jest.Mock).mockReturnValueOnce(givenNewModel.UUID);
        const actualPromise = repository.create(givenNewSkillGroupSpecSpec);

        // THEN expect the actual promise to reject
        await expect(actualPromise).rejects.toThrow(
          expect.toMatchErrorWithCause("SkillGroupRepository.create: create failed", /duplicate key .* dup key: { UUID/)
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.create(getNewSkillGroupSpec());
    });
  });

  describe("Test createMany() skill group ", () => {
    test("should successfully create a batch of new skill groups", async () => {
      // GIVEN some valid SkillGroupSpec
      const givenBatchSize = 3;
      const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

      // THEN expect all the Skill Groups to be created with the specific attributes
      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenNewSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
          })
        )
      );
    });

    test("should successfully create a batch of new skill groups even if some don't validate", async () => {
      // GIVEN two valid SkillGroupSpec
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [getNewSkillGroupSpec(), getNewSkillGroupSpec()];
      // AND two SkillGroupSpec that is invalid
      const givenInvalidSkillGroupSpec: INewSkillGroupSpec[] = [getNewSkillGroupSpec(), getNewSkillGroupSpec()];
      givenInvalidSkillGroupSpec[0].code = "invalid code"; // will not validate but will not throw an error
      // @ts-ignore
      givenInvalidSkillGroupSpec[1].foo = "invalid"; // will not validate and will throw an error

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: ISkillGroup[] = await repository.createMany([
        givenValidSkillGroupSpecs[0],
        ...givenInvalidSkillGroupSpec,
        givenValidSkillGroupSpecs[1],
      ]);

      // THEN expect only the valid Skill Group to be created
      expect(actualNewSkillGroups).toHaveLength(givenValidSkillGroupSpecs.length);

      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenValidSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
            return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
          })
        )
      );
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a batch of new skill groups when they have UUIDHistory with %i UUIDs",
      async (count: number) => {
        // GIVEN some valid SkillGroupSpec
        const givenBatchSize = 3;
        const givenNewSkillGroupSpecs: INewSkillGroupSpec[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenNewSkillGroupSpecs[i] = getNewSkillGroupSpec();
          givenNewSkillGroupSpecs[i].UUIDHistory = generateRandomUUIDs(count);
        }

        // WHEN creating the batch of skills Groups with the given specifications
        const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

        // THEN expect all the Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenNewSkillGroupSpecs.map((givenNewSkillGroupSpec, index) => {
              return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
            })
          )
        );
      }
    );

    test("should resolve to an empty array if none of the element could be validated", async () => {
      // GIVEN only invalid SkillGroupSpec
      const givenBatchSize = 3;
      const givenValidSkillGroupSpecs: INewSkillGroupSpec[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenValidSkillGroupSpecs[i] = getNewSkillGroupSpec();
        givenValidSkillGroupSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch of skills Groups with the given specifications
      const actualNewSkillGroups: INewSkillGroupSpec[] = await repository.createMany(givenValidSkillGroupSpecs);

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
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewSkillGroups: ISkillGroup[] = await repository.createMany(givenNewSkillGroupSpecs);

        // THEN expect only the first and the third the Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenNewSkillGroupSpecs
              .filter((spec, index) => index !== 1)
              .map((givenNewSkillGroupSpec, index) => {
                return expectedFromGivenSpec(givenNewSkillGroupSpec, actualNewSkillGroups[index].UUID);
              })
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.createMany([getNewSkillGroupSpec()]);
    });
  });

  describe("Test createManyLocalized() skill group", () => {
    test("should successfully create a batch of new skill groups from localized specs", async () => {
      // GIVEN some valid localized SkillGroupSpecs
      const givenBatchSize = 3;
      const givenSpecs: INewSkillGroupSpecLocalized[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenSpecs[i] = getNewSkillGroupSpecLocalized();
      }

      // WHEN creating the batch
      const actualNewSkillGroups: ISkillGroup[] = await repository.createManyLocalized(givenSpecs);

      // THEN expect all Skill Groups to be created with the specific attributes
      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenSpecs.map((spec, index) => expectedFromGivenLocalizedSpec(spec, actualNewSkillGroups[index].UUID))
        )
      );
    });

    test("should successfully create a batch even if some don't validate", async () => {
      // GIVEN two valid localized SkillGroupSpecs
      const givenValidSpecs: INewSkillGroupSpecLocalized[] = [
        getNewSkillGroupSpecLocalized(),
        getNewSkillGroupSpecLocalized(),
      ];
      // AND one invalid spec (bad code)
      const givenInvalidSpec = getNewSkillGroupSpecLocalized();
      givenInvalidSpec.code = "invalid code";

      // WHEN creating with a mix of valid and invalid
      const actualNewSkillGroups: ISkillGroup[] = await repository.createManyLocalized([
        givenValidSpecs[0],
        givenInvalidSpec,
        givenValidSpecs[1],
      ]);

      // THEN expect only the valid Skill Groups to be created
      expect(actualNewSkillGroups).toHaveLength(givenValidSpecs.length);
      expect(actualNewSkillGroups).toEqual(
        expect.arrayContaining(
          givenValidSpecs.map((spec, index) => expectedFromGivenLocalizedSpec(spec, actualNewSkillGroups[index].UUID))
        )
      );
    });

    test.each([0, 1, 2, 10])(
      "should successfully create a batch of localized skill groups when they have UUIDHistory with %i UUIDs",
      async (count: number) => {
        // GIVEN some valid localized SkillGroupSpecs with varying UUIDHistory lengths
        const givenBatchSize = 3;
        const givenSpecs: INewSkillGroupSpecLocalized[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenSpecs[i] = getNewSkillGroupSpecLocalized();
          givenSpecs[i].UUIDHistory = generateRandomUUIDs(count);
        }

        // WHEN creating the batch
        const actualNewSkillGroups: ISkillGroup[] = await repository.createManyLocalized(givenSpecs);

        // THEN expect all Skill Groups to be created with the specific attributes
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenSpecs.map((spec, index) => expectedFromGivenLocalizedSpec(spec, actualNewSkillGroups[index].UUID))
          )
        );
      }
    );

    test("should resolve to an empty array if none of the elements could be validated", async () => {
      // GIVEN only invalid localized SkillGroupSpecs
      const givenBatchSize = 3;
      const givenInvalidSpecs: INewSkillGroupSpecLocalized[] = [];
      for (let i = 0; i < givenBatchSize; i++) {
        givenInvalidSpecs[i] = getNewSkillGroupSpecLocalized();
        givenInvalidSpecs[i].code = "invalid code";
      }

      // WHEN creating the batch
      const actualNewSkillGroups: ISkillGroup[] = await repository.createManyLocalized(givenInvalidSpecs);

      // THEN expect no Skill Groups to be created
      expect(actualNewSkillGroups).toHaveLength(0);
    });

    test("should store the localized Maps directly in the database under the correct language keys", async () => {
      // GIVEN a localized spec with known translated values
      const fallbackKey = getFallbackLanguageConfig().dbKeyName;
      const givenSpec = getNewSkillGroupSpecLocalized({
        preferredLabel: new Map([[fallbackKey, "my preferred label"]]) as INewSkillGroupSpecLocalized["preferredLabel"],
        description: new Map([[fallbackKey, "my description"]]) as INewSkillGroupSpecLocalized["description"],
        scopeNote: new Map([[fallbackKey, "my scope note"]]) as INewSkillGroupSpecLocalized["scopeNote"],
        altLabels: [new Map([[fallbackKey, "my alt label"]])] as INewSkillGroupSpecLocalized["altLabels"],
      });

      // WHEN creating
      const [actualCreated] = await repository.createManyLocalized([givenSpec]);

      // THEN expect the raw document to carry them as localized sub documents keyed by the fallback language
      const actualRawDoc = await repository.Model.findById(actualCreated.id).lean();
      expect(actualRawDoc?.preferredLabel).toEqual({ [fallbackKey]: "my preferred label" });
      expect(actualRawDoc?.description).toEqual({ [fallbackKey]: "my description" });
      expect(actualRawDoc?.scopeNote).toEqual({ [fallbackKey]: "my scope note" });
      expect(actualRawDoc?.altLabels).toEqual([{ [fallbackKey]: "my alt label" }]);

      // AND expect the repository to have returned them as flat strings (fallback language)
      expect(actualCreated.preferredLabel).toEqual("my preferred label");
      expect(actualCreated.description).toEqual("my description");
      expect(actualCreated.scopeNote).toEqual("my scope note");
      expect(actualCreated.altLabels).toEqual(["my alt label"]);
    });

    describe("Test unique indexes", () => {
      test("should return only documents that did not violate the UUID unique index", async () => {
        // GIVEN 3 localized SkillGroupSpecs
        const givenBatchSize = 3;
        const givenSpecs: INewSkillGroupSpecLocalized[] = [];
        for (let i = 0; i < givenBatchSize; i++) {
          givenSpecs[i] = getNewSkillGroupSpecLocalized();
        }

        // WHEN creating with a duplicate UUID for the second entry
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        (randomUUID as jest.Mock).mockReturnValueOnce("014b0bd8-120d-4ca4-b4c6-40953b170219");
        const actualNewSkillGroups: ISkillGroup[] = await repository.createManyLocalized(givenSpecs);

        // THEN expect only the first and third Skill Groups to be created
        expect(actualNewSkillGroups).toEqual(
          expect.arrayContaining(
            givenSpecs
              .filter((_, index) => index !== 1)
              .map((spec, index) => expectedFromGivenLocalizedSpec(spec, actualNewSkillGroups[index].UUID))
          )
        );
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.createManyLocalized([getNewSkillGroupSpecLocalized()]);
    });
  });

  describe("Test the shape the translatable fields are stored in", () => {
    test("should store preferredLabel, description, scopeNote and altLabels as localized sub documents keyed by the fallback language", async () => {
      // GIVEN a new SkillGroup spec whose translatable fields are flat strings, as the repository API takes them
      const givenModelId = getMockStringId(1);
      const givenNewSkillGroupSpec: INewSkillGroupSpec = getNewSkillGroupSpec();
      givenNewSkillGroupSpec.modelId = givenModelId;

      // WHEN creating the SkillGroup
      const actualCreated = await repository.create(givenNewSkillGroupSpec);

      // THEN expect the raw document to carry them as localized sub documents keyed by the fallback language
      const actualRawDoc = await repository.Model.findById(actualCreated.id).lean();
      const expectedFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
      expect(actualRawDoc?.preferredLabel).toEqual({
        [expectedFallbackDbKeyName]: givenNewSkillGroupSpec.preferredLabel,
      });
      expect(actualRawDoc?.description).toEqual({ [expectedFallbackDbKeyName]: givenNewSkillGroupSpec.description });
      expect(actualRawDoc?.scopeNote).toEqual({ [expectedFallbackDbKeyName]: givenNewSkillGroupSpec.scopeNote });
      expect(actualRawDoc?.altLabels).toEqual(
        givenNewSkillGroupSpec.altLabels.map((altLabel) => ({ [expectedFallbackDbKeyName]: altLabel }))
      );

      // AND expect the repository to have returned them as flat strings, i.e. its public API is unchanged
      expect(actualCreated.preferredLabel).toEqual(givenNewSkillGroupSpec.preferredLabel);
      expect(actualCreated.description).toEqual(givenNewSkillGroupSpec.description);
      expect(actualCreated.scopeNote).toEqual(givenNewSkillGroupSpec.scopeNote);
      expect(actualCreated.altLabels).toEqual(givenNewSkillGroupSpec.altLabels);

      // AND expect code to be stored as a plain string, it is monolingual
      expect(actualRawDoc?.code).toEqual(givenNewSkillGroupSpec.code);
    });
  });

  describe("Test findById()", () => {
    test("should find an SkillGroup by its id", async () => {
      // GIVEN an SkillGroup exists in the database
      const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
      const givenSkillGroup = await repository.create(givenSkillGroupSpec);

      console.log(givenSkillGroup);

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById(givenSkillGroup.id);

      // THEN expect the SkillGroup to be found
      expect(actualFoundSkillGroup).toEqual(givenSkillGroup);
    });

    test("should return null if no SkillGroup with the given id exists", async () => {
      // GIVEN no SkillGroup exists in the database

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById(new mongoose.Types.ObjectId().toHexString());

      // THEN expect no SkillGroup to be found
      expect(actualFoundSkillGroup).toBeNull();
    });

    test("should return null if given id is not a valid object id", async () => {
      // GIVEN no SkillGroup exists in the database

      // WHEN searching for the SkillGroup by its id
      const actualFoundSkillGroup = await repository.findById("non_existing_id");

      // THEN expect no SkillGroup to be found
      expect(actualFoundSkillGroup).toBeNull();
    });

    test("should return the SkillGroup with its parents(SkillGroups) and children(SkillGroup, Skill)", async () => {
      // GIVEN four SkillGroup and one Skill exists in the database in the same model
      const givenModelId = getMockStringId(1);
      // THE subject (SkillGroup)
      const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);

      // The parent (SkillGroup)
      const givenParentSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "parent_1");
      const givenParent_1 = await repository.create(givenParentSpecs_1);

      // The parent (SkillGroup)
      const givenParentSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "parent_2");
      const givenParent_2 = await repository.create(givenParentSpecs_2);

      // The child SkillGroup
      const givenChildSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);

      // The child Skill
      const givenChildSpecs_2 = getSimpleNewSkillSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.skill.create(givenChildSpecs_2);

      // AND the subject SkillGroup has a parent and two children
      const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          // parent 1 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent_1.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenSubject.id,
        },
        {
          // parent 2 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent_2.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenSubject.id,
        },
        {
          // child 1 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChild_1.id,
        },
        {
          // child 2 of the subject
          parentType: ObjectTypes.SkillGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_2.id,
        },
      ]);
      // Guard assertion
      expect(actualHierarchy).toHaveLength(4);

      // WHEN searching for the subject by its id
      // setup populate with explain to assert the populate query plan is using the correct indexes and is not doing a collection scan
      const actualPlans = setUpPopulateWithExplain<ISkillGroupDoc>(repository.Model);
      const actualFoundSkillGroup = (await repository.findById(givenSubject.id)) as ISkillGroup;

      // THEN expect the ISkillGroup to be found
      expect(actualFoundSkillGroup).not.toBeNull();

      // AND to have the given parents
      expect(actualFoundSkillGroup.parents).toEqual(
        expect.arrayContaining([expectedSkillGroupReference(givenParent_1), expectedSkillGroupReference(givenParent_2)])
      );
      // AND to have the given children
      expect(actualFoundSkillGroup.children).toEqual(
        expect.arrayContaining([expectedSkillGroupReference(givenChild_1), expectedSkillReference(givenChild_2)])
      );

      // AND expect the populate query plan to use the correct indexes
      expect(actualPlans).toHaveLength(5); // 1 for the parent and 1 for the child hierarchies, 1 for the parent and 2 for the children references
      expect(actualPlans).toEqual(
        expect.arrayContaining([
          // populating the parent hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              childType: { $eq: ObjectTypes.SkillGroup },
              childId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_PARENTS,
          }),
          // populating the child hierarchy
          getExpectedPlan({
            collectionName: repositoryRegistry.skillHierarchy.hierarchyModel.collection.name,
            filter: {
              modelId: { $eq: new mongoose.Types.ObjectId(givenModelId) },
              parentType: { $eq: ObjectTypes.SkillGroup },
              parentId: { $in: [new mongoose.Types.ObjectId(givenSubject.id)] },
            },
            usedIndex: INDEX_FOR_CHILDREN,
          }),
        ])
      );
      // AND expect no error to be logged
      expect(console.error).toBeCalledTimes(0);
    });

    describe("Test Skill hierarchy robustness to inconsistencies", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      test("should ignore parents that are not SkillGroups", async () => {
        // GIVEN an inconsistency was introduced, and non-SkillGroup document is a parent of an SkillGroup
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
        const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
        // The non-SkillGroup in this case a Skill
        const givenNewSkillSpec: INewSkillSpec = getSimpleNewSkillSpec(getMockStringId(1), "skill_1");
        const givenSkill = await repositoryRegistry.skill.create(givenNewSkillSpec);
        // it is important to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkillGroup.modelId),

          //@ts-ignore
          parentType: ObjectTypes.Skill, // <- This is the inconsistency
          parentDocModel: MongooseModelName.Skill, // <- This is the inconsistency
          parentId: new mongoose.Types.ObjectId(givenSkill.id), // <- This is the inconsistency

          childId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenSkillGroup.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.parents).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not a SkillGroup: ${givenInconsistentPair.parentDocModel}`);
      });

      test("should ignore children that are not SkillGroups | Skills", async () => {
        // GIVEN an inconsistency was introduced, and non-SkillGroup document is a child of an SkillGroup
        // The SkillGroup
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1");
        const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
        // The non-SkillGroup in this case an Occupation group
        const givenNewOccupationGroupSpec: INewOccupationGroupSpec = getSimpleNewISCOGroupSpec(
          getMockStringId(1),
          "group_1"
        );
        const givenOccupationGroup = await repositoryRegistry.OccupationGroup.create(givenNewOccupationGroupSpec);
        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenSkillGroup.modelId),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup.id),
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          //@ts-ignore
          childType: ObjectTypes.ISCOGroup, // <- This is an example of an inconsistency
          childDocModel: MongooseModelName.OccupationGroup, // <- This is the inconsistency
          childId: new mongoose.Types.ObjectId(givenOccupationGroup.id), // <- This is the inconsistency

          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup by its id
        jest.spyOn(console, "error");
        const actualFoundGroup = await repository.findById(givenSkillGroup.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup).not.toBeNull();
        expect(actualFoundGroup!.children).toEqual([]);
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(
          `Child is not a SkillGroup or Skill: ${givenInconsistentPair.childDocModel}`
        );
      });

      test("should not find parent or child if the hierarchy is in a different model", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found
        // the third model
        const givenModelId_3 = getMockStringId(3);

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_3), // <-- this is the inconsistency

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        const actualFoundGroup_1 = await repository.findById(givenSkillGroup_1.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]);
        expect(actualFoundGroup_1!.parents).toEqual([]);

        // WHEN searching for the SkillGroup_1 by its id
        const actualFoundGroup_2 = await repository.findById(givenSkillGroup_2.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.children).toEqual([]);
        expect(actualFoundGroup_2!.parents).toEqual([]);
      });

      test("should not find parent if it is not in the same model as the child", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_1),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id),
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id), // <-- this is the inconsistency
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };
        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_1 = await repository.findById(givenSkillGroup_1.id);

        // THEN expect the SkillGroup to not contain the inconsistent children
        expect(actualFoundGroup_1).not.toBeNull();
        expect(actualFoundGroup_1!.children).toEqual([]); // <-- The inconsistent child is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Child is not in the same model as the parent`);
      });

      test("should not find child if it is not is the same model as the parent", async () => {
        // GIVEN an inconsistency was introduced, and the child and the parent are in different models
        // The SkillGroup 1
        const givenModelId_1 = getMockStringId(1);
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId_1, "group_1");
        const givenSkillGroup_1 = await repository.create(givenSkillGroupSpecs_1);
        // The SkillGroup 2
        const givenModelId_2 = getMockStringId(2);
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId_2, "group_2");
        const givenSkillGroup_2 = await repository.create(givenSkillGroupSpecs_2);

        // it is import to cast the id to ObjectId, otherwise the parents will not be found

        //@ts-ignore
        const givenInconsistentPair: ISkillHierarchyPairDoc = {
          modelId: new mongoose.Types.ObjectId(givenModelId_2),

          parentId: new mongoose.Types.ObjectId(givenSkillGroup_1.id), // <-- this is the inconsistency
          parentDocModel: MongooseModelName.SkillGroup,
          parentType: ObjectTypes.SkillGroup,

          childId: new mongoose.Types.ObjectId(givenSkillGroup_2.id),
          childDocModel: MongooseModelName.SkillGroup,
          childType: ObjectTypes.SkillGroup,
        };

        await repositoryRegistry.skillHierarchy.hierarchyModel.collection.insertOne(givenInconsistentPair);

        // WHEN searching for the SkillGroup_1 by its id
        jest.spyOn(console, "error");
        const actualFoundGroup_2 = await repository.findById(givenSkillGroup_2.id);

        // THEN expect the SkillGroup to not contain the inconsistent parent
        expect(actualFoundGroup_2).not.toBeNull();
        expect(actualFoundGroup_2!.parents).toEqual([]); // <-- The inconsistent parent is removed
        // AND expect an error to be logged
        expect(console.error).toBeCalledTimes(1);
        expect(console.error).toBeCalledWith(`Parent is not in the same model as the child`);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating children", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        Skill
        // 1,        2,        Skill,  4,       Skill

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Skill group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND a Skill givenSkill_1 with a given ID in the given model
        const givenSkill1Specs = getSimpleNewSkillSpec(givenModelId, "Skill_1");
        // @ts-ignore
        givenSkill1Specs.id = givenID.toHexString();
        const givenSkill_1 = await repositoryRegistry.skill.create(givenSkill1Specs);
        // guard to ensure the id is the given one
        expect(givenSkill_1.id).toEqual(givenID.toHexString());

        // AND a second skill_2 with some ID  in the given model
        const givenSkillSpecs_2 = getSimpleNewSkillSpec(givenModelId, "skill_2");
        const givenSkill_2 = await repositoryRegistry.skill.create(givenSkillSpecs_2);

        // AND a third skill_3 with some ID in the given model
        const givenSkillSpecs_3 = getSimpleNewSkillSpec(givenModelId, "skill_3");
        const givenSkill_3 = await repositoryRegistry.skill.create(givenSkillSpecs_3);

        // AND the skill skill_1  is the parent of skill_2
        // AND the subject SkillGroup  is the parent of Skill_3
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSubject.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_3.id,
          },
          {
            parentType: ObjectTypes.Skill,
            parentId: givenSkill_1.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_2.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only skill 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.children).toEqual([expectedSkillReference(givenSkill_3)]);
      });

      test("should not match entities that have the same ID but are of different types (collections) when populating parents", async () => {
        // The state of the database that could lead to an inconsistency, if the populate function is not doing a match based on id and parentType
        // modelId, parentId, parentType, childId, childType,
        // 1,        2,        SkillGroup,  3,        Skill
        // 1,        2,        SkillGroup,  4,       SkillGroup

        // GIVEN a modelId
        const givenModelId = getMockStringId(1);
        // AND a subject Skill group with the givenId
        const givenID = new mongoose.Types.ObjectId(2);
        const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
        // @ts-ignore
        givenSubjectSpecs.id = givenID.toHexString();
        const givenSubject = await repository.create(givenSubjectSpecs);
        // guard to ensure the id is the given one
        expect(givenSubject.id).toEqual(givenID.toHexString());

        // AND a Skill givenSkill_1 with the given ID in the given model
        const givenSkill_Specs_1 = getSimpleNewSkillSpec(givenModelId, "Skill 1");
        // @ts-ignore
        givenSkill_Specs_1.id = givenID.toHexString();
        const givenSkill_1 = await repositoryRegistry.skill.create(givenSkill_Specs_1);
        // guard to ensure the id is the given one
        expect(givenSkill_1.id).toEqual(givenID.toHexString());

        // AND a skill group with some ID  in the given model
        const givenSkillGroupSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "SkillGroup 1");
        const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs_1);

        // AND another skill group with some ID in the given model
        const givenSkillGroupSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "Skill Group");
        const givenSkillGroup_2 = await repositoryRegistry.skillGroup.create(givenSkillGroupSpecs_2);

        // AND the Skill Group 1 is the parent of Skill 1
        // AND the Skill Group 2 is the parent of the subject SkillGroup
        const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup_1.id,
            childType: ObjectTypes.Skill,
            childId: givenSkill_1.id,
          },
          {
            parentType: ObjectTypes.SkillGroup,
            parentId: givenSkillGroup_2.id,
            childType: ObjectTypes.SkillGroup,
            childId: givenSubject.id,
          },
        ]);
        // Guard assertion
        expect(actualHierarchy).toHaveLength(2);

        // WHEN we retrieve the subject by its id
        const actualFoundSubject = await repository.findById(givenSubject.id);

        // THEN we expect to find only skill 2 as a child
        expect(actualFoundSubject).not.toBeNull();
        expect(actualFoundSubject!.parents).toEqual([expectedSkillGroupReference(givenSkillGroup_2)]);
      });
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.findById(getMockStringId(1));
    });
  });

  describe("Test findAll()", () => {
    test("should find all SkillGroups in the correct model", async () => {
      // Given some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of SkillGroups exist in the database for the given Model
      const givenSkillGroups = await createSkillGroupsInDB(givenModelId);
      // AND some other SkillGroups exist in the database for a different model
      const givenModelId_other = getMockStringId(2);
      await createSkillGroupsInDB(givenModelId_other);

      // WHEN searching for all SkillGroups in the given model
      const actualSkillGroups = repository.findAll(givenModelId);

      // THEN the SkillGroups should be returned as a consumable stream that emits all SkillGroups
      const actualSkillGroupsArray: ISkillGroup[] = [];
      for await (const data of actualSkillGroups) {
        actualSkillGroupsArray.push(data);
      }

      const expectedSkillGroups = givenSkillGroups.map((ISkillGroup) => {
        const { parents, children, ...SkillGroupData } = ISkillGroup;
        return SkillGroupData;
      });
      expect(actualSkillGroupsArray).toEqual(expectedSkillGroups);
    });

    test("should not return any SkillGroups when the model does not have any and other models have", async () => {
      // GIVEN no SkillGroups exist in the database for the given model
      const givenModelId = getMockStringId(1);
      // AND some other SkillGroups exist in the database for a different model
      await createSkillGroupsInDB(getMockStringId(2));

      // WHEN the findAll method is called
      const actualStream = repository.findAll(givenModelId);

      // THEN the stream should end without emitting any data
      const receivedData: ISkillGroup[] = [];
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

      // THEN the findAll method should throw an error for skillGroups
      expect(() => repository.findAll(givenModelId)).toThrow(
        expect.toMatchErrorWithCause("SkillGroupRepository.findAll: findAll failed", givenError.message)
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

      // WHEN searching for all SkillGroups in the given model
      const actualSkillGroups = repository.findAll(getMockStringId(1));

      // THEN expect the SkillGroups to be returned as a consumable stream that emits an error and ends
      const actualSkillGroupsArray: ISkillGroup[] = [];
      await expect(async () => {
        for await (const data of actualSkillGroups) {
          actualSkillGroupsArray.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("SkillGroupRepository.findAll: stream failed", givenError.message)
      );
      expect(actualSkillGroups.closed).toBeTruthy();
      expect(actualSkillGroupsArray).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.skillGroup.findAll(getMockStringId(1))
    );
  });

  describe("Test findPaginated()", () => {
    test("should return first page when cursor is undefined", async () => {
      // GIVEN a modelId to group the skillGroups together
      const givenModelId = getMockStringId(1);
      const givenSkillGroups: ISkillGroup[] = [];
      for (let i = 0; i < 3; i++) {
        const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(givenModelId, `group_${i}`);
        const givenSkillGroup = await repository.create(givenSkillGroupSpec);
        givenSkillGroups.push(givenSkillGroup);
      }

      // WHEN retrieving the first page of skillGroups
      const firstPage = await repository.findPaginated(givenModelId, 2, -1);
      const actualFirstPage = firstPage;

      // THEN expect the latest 2 documents by _id (desc)
      const expectedFirstPage = givenSkillGroups
        .slice(-2)
        .map(({ parents, children, ...rest }) => ({ ...rest, parents: [], children: [] }))
        .reverse();

      expect(actualFirstPage).toHaveLength(2);
      expect(actualFirstPage).toEqual(expectedFirstPage);
    });
    test("should return paginated SkillGroups for a given modelId, limit, and cursor", async () => {
      // GIVEN a modelId to group the skillGroups together
      const givenModelId = getMockStringId(1);
      const givenSkillGroups: ISkillGroup[] = [];
      for (let i = 0; i < 3; i++) {
        const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, `group_${i + 1}`);
        const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
        givenSkillGroups.push(givenSkillGroup);
      }
      // WHEN retrieving the skillGroups with a cursor pointing to group_3 (newest) and limit of 2
      const firstPage = await repository.findPaginated(givenModelId, 2, -1);
      const actualFirstPageSkillGroupsArray = firstPage;
      // THEN the first page should contain group_2 and group_1 (items older than group_3) ordered by _id desc
      const expectedSkillGroups = givenSkillGroups
        .slice(1, 3)
        .map(({ parents, children, ...rest }) => ({ ...rest, parents: [], children: [] }))
        .reverse();

      expect(actualFirstPageSkillGroupsArray).toHaveLength(2);
      const expectedFirstPageSkillGroups = expectedSkillGroups; // [group_2,group_1]
      expect(actualFirstPageSkillGroupsArray).toHaveLength(2);
      expect(actualFirstPageSkillGroupsArray).toEqual(expectedFirstPageSkillGroups);
    });
    test("should handle errors during paginated data retrieval", async () => {
      // GIVEN that an error will occur when retrieving the paginated data
      const givenError = new Error("foo");
      jest.spyOn(repository.Model, "aggregate").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN find paginated skillGroups for some modelId
      // THEN expect the operation to fail with the given error
      await expect(repository.findPaginated(getMockStringId(1), 2, -1)).rejects.toThrowError(
        new Error("SkillGroupRepository.findPaginated: findPaginated failed", { cause: givenError })
      );
    });
    test("should reject when database query fails", async () => {
      const givenError = new Error("database query failure");

      const aggregateSpy = jest.spyOn(repository.Model, "aggregate").mockReturnValue({
        exec: jest.fn().mockRejectedValue(givenError),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(repository.findPaginated(getMockStringId(1), 1, -1)).rejects.toThrow(
        new Error("SkillGroupRepository.findPaginated: findPaginated failed", { cause: givenError })
      );

      aggregateSpy.mockRestore();
    });
    test("should paginate consistently across mixed limits and cursor flow", async () => {
      // GIVEN a modelId and three skill groups created in order
      const givenModelId = getMockStringId(1);
      const given_skill_group1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g1"));
      const given_skill_group2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g2"));
      const given_skill_group3 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g3"));

      // WHEN requesting first page with limit=3 and no cursor (desc by _id => newest first)
      const page2 = await repository.findPaginated(givenModelId, 3, -1);
      // THEN expect when fetching three items with limit=3, to get all three items in the correct order
      expect(page2).toHaveLength(3);
      const firstTwoIds = page2.map((i) => i.id);
      expect(firstTwoIds).toEqual([given_skill_group3.id, given_skill_group2.id, given_skill_group1.id]);

      // WHEN requesting first page with limit=1 and no cursor
      const page1 = await repository.findPaginated(givenModelId, 1, -1);
      expect(page1).toHaveLength(1);
      expect(page1[0].id).toBe(given_skill_group3.id);
    });
    test("should warn and ignore invalid cursor", async () => {
      // GIVEN a unique modelId and some skill groups
      const givenModelId = getMockStringId(999); // Use a unique modelId to avoid conflicts
      const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, "test_group");
      const createdGroup = await repository.create(givenSkillGroupSpecs);

      // WHEN finding paginated skillGroups with an invalid cursor
      const result = await repository.findPaginated(givenModelId, 2, -1);

      // AND expect the result to ignore the invalid cursor and return the first page
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(createdGroup.id);
    });
    test("should ignore an invalid cursor id value when paginating", async () => {
      const givenModelId = getMockStringId(1);
      const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "group_1"));

      const aggregateSpy = jest.spyOn(repository.Model, "aggregate").mockReturnValue({
        exec: jest.fn().mockResolvedValue([givenSkillGroup]),
      } as never);

      const result = await repository.findPaginated(givenModelId, 2, -1, "not-a-valid-object-id");

      expect(result).toHaveLength(1);
      const firstPipelineMatch = (aggregateSpy.mock.calls[0][0][0] as { $match: Record<string, unknown> }).$match;
      expect(firstPipelineMatch).toEqual(
        expect.objectContaining({
          modelId: new mongoose.Types.ObjectId(givenModelId),
        })
      );
      expect(firstPipelineMatch._id).toBeUndefined();
      aggregateSpy.mockRestore();
    });
    test("should populate parents and children for items in paginated results", async () => {
      // GIVEN a modelId and small hierarchy: parent->subject->child
      const givenModelId = getMockStringId(1);

      // Parent group
      const parent = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "parent"));
      // Subject group
      const subject = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "subject"));
      // Child group
      const child = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "child"));

      // Build hierarchy relations explicitly
      const hierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent.id,
          childType: ObjectTypes.SkillGroup,
          childId: subject.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: subject.id,
          childType: ObjectTypes.SkillGroup,
          childId: child.id,
        },
      ]);
      expect(hierarchy).toHaveLength(2);

      // WHEN retrieving a page large enough to include all three
      const page = await repository.findPaginated(givenModelId, 10, -1);

      // THEN find the subject entry and assert it has populated parent and children
      const subjectFromPage = page.find((i) => i.id === subject.id);
      expect(subjectFromPage).toBeDefined();
      expect(subjectFromPage!.parents).toEqual(
        expect.arrayContaining<ISkillGroupReference>([expectedSkillGroupReference(parent)])
      );
      expect(subjectFromPage!.children).toEqual(
        expect.arrayContaining<ISkillGroupReference | ISkillReference>([expectedSkillGroupReference(child)])
      );
    });
    test("should handle sorting with sortOrder parameter", async () => {
      // GIVEN a modelId to group the skillGroups together
      const givenModelId = getMockStringId(1);
      const givenSkillGroups: ISkillGroup[] = [];
      for (let i = 0; i < 3; i++) {
        const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(givenModelId, `group_${i}`);
        const givenSkillGroup = await repository.create(givenSkillGroupSpec);
        givenSkillGroups.push(givenSkillGroup);
      }

      // WHEN retrieving the first page of skillGroups
      const firstPage = await repository.findPaginated(givenModelId, 2, 1);
      const actualFirstPage = firstPage;

      // THEN expect the latest 2 documents by _id (desc)
      const expectedFirstPage = givenSkillGroups
        .slice(0, 2)
        .map(({ parents, children, ...rest }) => ({ ...rest, parents: [], children: [] }));

      expect(actualFirstPage).toHaveLength(2);
      expect(actualFirstPage).toEqual(expectedFirstPage);
    });

    test("should filter paginated skillGroups by matching skill-group children", async () => {
      const givenModelId = getMockStringId(1);
      const parentWithSkillGroupChild = await repository.create(
        getSimpleNewSkillGroupSpec(givenModelId, "parent-group")
      );
      const parentWithSkillChild = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "parent-skill"));
      const unrelatedParent = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "unrelated-parent"));
      const skillGroupChild = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "child-group"));
      const skillChild = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "child-skill"));

      await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parentWithSkillGroupChild.id,
          childType: ObjectTypes.SkillGroup,
          childId: skillGroupChild.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parentWithSkillChild.id,
          childType: ObjectTypes.Skill,
          childId: skillChild.id,
        },
      ]);

      const filteredBySkillGroup = await repository.findPaginated(givenModelId, 10, -1, undefined, {
        childrenIds: skillGroupChild.id,
        childrenType: ObjectTypes.SkillGroup,
      });
      expect(filteredBySkillGroup.map((item) => item.id)).toEqual([parentWithSkillGroupChild.id]);
      expect(filteredBySkillGroup.map((item) => item.id)).not.toContain(unrelatedParent.id);

      const filteredBySkill = await repository.findPaginated(givenModelId, 10, -1, undefined, {
        childrenIds: skillChild.id,
        childrenType: ObjectTypes.Skill,
      });
      expect(filteredBySkill.map((item) => item.id)).toEqual([parentWithSkillChild.id]);
    });

    test("should return an empty array when childrenIds contains no valid object ids", async () => {
      const givenModelId = getMockStringId(1);
      const aggregateSpy = jest.spyOn(repository.hierarchyModel, "aggregate");
      const modelAggregateSpy = jest.spyOn(repository.Model, "aggregate");

      const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, {
        childrenIds: "not-a-valid-object-id;still-not-valid",
        childrenType: ObjectTypes.SkillGroup,
      });

      expect(actual).toEqual([]);
      expect(aggregateSpy).not.toHaveBeenCalled();
      expect(modelAggregateSpy).not.toHaveBeenCalled();

      aggregateSpy.mockRestore();
      modelAggregateSpy.mockRestore();
    });

    test("should return an empty array when no matching parent skillGroups exist for the children filter", async () => {
      const givenModelId = getMockStringId(1);
      const orphanChild = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "orphan-child"));
      const aggregateSpy = jest.spyOn(repository.hierarchyModel, "aggregate").mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as never);
      const modelAggregateSpy = jest.spyOn(repository.Model, "aggregate");

      const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, {
        childrenIds: orphanChild.id,
        childrenType: ObjectTypes.SkillGroup,
      });

      expect(actual).toEqual([]);
      expect(aggregateSpy).toHaveBeenCalled();
      expect(modelAggregateSpy).not.toHaveBeenCalled();

      aggregateSpy.mockRestore();
      modelAggregateSpy.mockRestore();
    });

    test("should call the model with the right pipeline when requesting root skillGroups", async () => {
      // GIVEN a modelId, a limit and a descending sort order
      const givenModelId = getMockStringId(1);
      const givenLimit = 5;
      const givenSortOrder = -1;
      // AND a filter requesting only root skillGroups
      const givenFilter = { root: true };
      // AND the model's aggregate will resolve to an empty result set
      const aggregateSpy = jest.spyOn(repository.Model, "aggregate").mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // WHEN finding paginated root skillGroups
      const actualResult = await repository.findPaginated(
        givenModelId,
        givenLimit,
        givenSortOrder,
        undefined,
        givenFilter
      );

      // THEN expect an empty result to be returned
      expect(actualResult).toEqual([]);
      // AND expect aggregate to have been called exactly once with the root-aware pipeline
      const expectedPipeline = [
        {
          $match: {
            modelId: expect.any(mongoose.Types.ObjectId),
          },
        },
        {
          $lookup: {
            from: repository.hierarchyModel.collection.name,
            let: { groupId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$childId", "$$groupId"] },
                  modelId: { $eq: expect.any(mongoose.Types.ObjectId) },
                  childType: { $in: [ObjectTypes.SkillGroup] },
                },
              },
            ],
            as: "parent_links",
          },
        },
        {
          $match: {
            parent_links: { $eq: [] },
          },
        },
        { $sort: { _id: givenSortOrder } },
        { $limit: givenLimit },
      ];
      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(aggregateSpy).toHaveBeenCalledWith(expectedPipeline);

      // AND expect the modelId used in both the lookup and the top-level match to be the given modelId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actualPipeline = aggregateSpy.mock.calls[0][0] as any[];
      expect(actualPipeline[1].$lookup.pipeline[0].$match.modelId.$eq.toString()).toBe(givenModelId);
      expect(actualPipeline[0].$match.modelId.toString()).toBe(givenModelId);

      aggregateSpy.mockRestore();
    });

    test("should return only root skillGroups when filter.root is true", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND a root skillGroup that has no parent
      const givenRootSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "root-group"));
      // AND a child skillGroup that has the root skillGroup as a parent
      const givenChildSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "child-group"));
      await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenRootSkillGroup.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChildSkillGroup.id,
        },
      ]);

      // WHEN finding paginated skillGroups filtered by root=true
      const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, { root: true });

      // THEN expect only the root skillGroup to be returned
      expect(actual.map((item) => item.id)).toEqual([givenRootSkillGroup.id]);
      // AND expect the child skillGroup to not be included in the response
      expect(actual.map((item) => item.id)).not.toContain(givenChildSkillGroup.id);
    });
    test("should paginate with ascending sort order and a valid cursor", async () => {
      // GIVEN multiple skill groups in the same model
      const givenModelId = getMockStringId(1);
      const givenSkillGroup1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "a_group"));
      const givenSkillGroup2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "b_group"));
      const givenSkillGroup3 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "c_group"));

      // WHEN requesting paginated results with ascending sort and cursor at the first item
      const actual = await repository.findPaginated(givenModelId, 2, 1, givenSkillGroup1.id);

      // THEN expect the next items after the cursor to be returned in ascending order
      expect(actual).toHaveLength(2);
      expect(actual[0].id).toBe(givenSkillGroup2.id);
      expect(actual[1].id).toBe(givenSkillGroup3.id);
    });
    test("should paginate with descending sort order and a valid cursor", async () => {
      // GIVEN multiple skill groups in the same model
      const givenModelId = getMockStringId(1);
      const givenSkillGroup1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "a_group"));
      const givenSkillGroup2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "b_group"));
      const givenSkillGroup3 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "c_group"));

      // WHEN requesting paginated results with descending sort and cursor at the last item
      const actual = await repository.findPaginated(givenModelId, 2, -1, givenSkillGroup3.id);

      // THEN expect the items before the cursor to be returned in descending order
      expect(actual).toHaveLength(2);
      expect(actual[0].id).toBe(givenSkillGroup2.id);
      expect(actual[1].id).toBe(givenSkillGroup1.id);
    });

    describe("with a search value", () => {
      test("should only return the SkillGroups whose requested field matches the search value (case-insensitive)", async () => {
        // GIVEN a model with three skill groups, two of which match the search value on preferredLabel
        const givenModelId = getMockStringId(1);
        const givenDataScience = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "Data Science"));
        const givenDataEngineering = await repository.create(
          getSimpleNewSkillGroupSpec(givenModelId, "DATA engineering")
        );
        await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "Nursing"));

        // WHEN searching for "data" on preferredLabel
        const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "data",
          fields: ["preferredLabel"],
        });

        // THEN expect only the two matching skill groups
        expect(actual.map((g) => g.id).sort()).toEqual([givenDataScience.id, givenDataEngineering.id].sort());
      });

      test("should treat the search value literally (regex special characters are escaped)", async () => {
        // GIVEN a model with a skill group whose label contains regex special characters
        const givenModelId = getMockStringId(1);
        const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "a.b.c"));
        await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "axbxc"));

        // WHEN searching for the literal value "a.b.c"
        const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "a.b.c",
          fields: ["preferredLabel"],
        });

        // THEN expect only the skill group that matches literally
        expect(actual).toHaveLength(1);
        expect(actual[0].id).toBe(givenSkillGroup.id);
      });

      test("should match the search value on description, scopeNote and altLabels, which are localized sub documents too", async () => {
        // GIVEN a model with two skill groups, distinguishable by their description, scopeNote and altLabels
        const givenModelId = getMockStringId(1);
        const givenMatchingSpec = getSimpleNewSkillGroupSpec(givenModelId, "matching");
        givenMatchingSpec.description = "Caring for the sick";
        givenMatchingSpec.scopeNote = "Excludes veterinary care";
        givenMatchingSpec.altLabels = ["Carers"];
        const givenMatchingSkillGroup = await repository.create(givenMatchingSpec);
        const givenOtherSpec = getSimpleNewSkillGroupSpec(givenModelId, "other");
        givenOtherSpec.description = "Writing software";
        givenOtherSpec.scopeNote = "Excludes hardware design";
        givenOtherSpec.altLabels = ["Developers"];
        await repository.create(givenOtherSpec);

        // WHEN searching for a value that occurs in the description of the first skill group only
        const actualFoundByDescription = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "caring",
          fields: ["description"],
        });

        // THEN expect only that skill group, i.e. the query reaches into the localized sub document
        expect(actualFoundByDescription).toHaveLength(1);
        expect(actualFoundByDescription[0].id).toEqual(givenMatchingSkillGroup.id);

        // WHEN searching for a value that occurs in the scopeNote of the first skill group only
        const actualFoundByScopeNote = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "veterinary",
          fields: ["scopeNote"],
        });

        // THEN expect only that skill group
        expect(actualFoundByScopeNote).toHaveLength(1);
        expect(actualFoundByScopeNote[0].id).toEqual(givenMatchingSkillGroup.id);

        // WHEN searching for a value that occurs in the altLabels of the first skill group only
        const actualFoundByAltLabels = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "carers",
          fields: ["altLabels"],
        });

        // THEN expect only that skill group, i.e. the query reaches into every item of the localized list
        expect(actualFoundByAltLabels).toHaveLength(1);
        expect(actualFoundByAltLabels[0].id).toEqual(givenMatchingSkillGroup.id);
      });

      test("should not match the search value on code, which stays monolingual", async () => {
        // GIVEN a model with a skill group whose code is a plain string, not a localized sub document
        const givenModelId = getMockStringId(1);
        const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "a group"));

        // WHEN searching for that code
        const actualFound = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: givenSkillGroup.code,
          fields: ["code"],
        });

        // THEN expect the skill group to be found, i.e. the query targets code itself and not a language of it
        expect(actualFound).toHaveLength(1);
        expect(actualFound[0].id).toEqual(givenSkillGroup.id);
      });

      test("should return an empty array when nothing matches the search value", async () => {
        // GIVEN a model with a skill group
        const givenModelId = getMockStringId(1);
        await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "Nursing"));

        // WHEN searching for a value that matches nothing
        const actual = await repository.findPaginated(givenModelId, 10, -1, undefined, undefined, {
          value: "data",
          fields: ["preferredLabel"],
        });

        // THEN expect no results
        expect(actual).toHaveLength(0);
      });
    });
  });

  describe("Test findByIds()", () => {
    test("should return the SkillGroups of the model with the given ids", async () => {
      // GIVEN a model with three skill groups
      const givenModelId = getMockStringId(1);
      const given1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g1"));
      const given2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g2"));
      await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g3"));

      // WHEN finding two of them by id
      const actual = await repository.findByIds(givenModelId, [given1.id, given2.id]);

      // THEN expect exactly those two skill groups back (order not guaranteed)
      expect(actual.map((g) => g.id).sort()).toEqual([given1.id, given2.id].sort());
    });

    test("should ignore invalid ids and ids that do not belong to the model", async () => {
      // GIVEN a model with one skill group, and another skill group in a different model
      const givenModelId = getMockStringId(1);
      const givenOtherModelId = getMockStringId(2);
      const given = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "g1"));
      const givenOther = await repository.create(getSimpleNewSkillGroupSpec(givenOtherModelId, "other"));

      // WHEN finding by a mix of a valid id, an invalid id and an id from another model
      const actual = await repository.findByIds(givenModelId, [given.id, "not-an-id", givenOther.id]);

      // THEN expect only the skill group of the model to be returned
      expect(actual).toHaveLength(1);
      expect(actual[0].id).toBe(given.id);
    });

    test("should return an empty array when no valid ids are given", async () => {
      // GIVEN a model
      const givenModelId = getMockStringId(1);

      // WHEN finding by only invalid ids
      const actual = await repository.findByIds(givenModelId, ["not-an-id", ""]);

      // THEN expect an empty array
      expect(actual).toEqual([]);
    });

    test("should reject when the database query fails", async () => {
      // GIVEN the aggregation will fail
      const givenError = new Error("database query failure");
      jest.spyOn(repository.Model, "aggregate").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN finding by ids THEN expect it to reject
      await expect(repository.findByIds(getMockStringId(1), [getMockStringId(2)])).rejects.toThrow(
        new Error("SkillGroupRepository.findByIds: findByIds failed", { cause: givenError })
      );
    });
  });

  describe("Test findParents()", () => {
    test("should find a SkillGroup parents by childId", async () => {
      // GIVEN three SkillGroups and one Skill exists in the database in the same model
      const givenModelId = getMockStringId(1);

      // The root parent (SkillGroup)
      const givenParentSpecs = getSimpleNewSkillGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);
      // the 2nd level parent (SkillGroup)
      const givenSubjectSpecs = getSimpleNewSkillGroupSpec(givenModelId, "subject");
      const givenSubject = await repository.create(givenSubjectSpecs);
      // the child (SkillGroup)
      const givenChildSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "child_1");
      const givenChild_1 = await repository.create(givenChildSpecs_1);
      // the child (Skill)
      const givenChildSpecs_2 = getSimpleNewSkillSpec(givenModelId, "child_2");
      const givenChild_2 = await repositoryRegistry.skill.create(givenChildSpecs_2);
      // AND the hierarchy is parent -> subject -> child_1 and parent -> child_2
      const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenSubject.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenSubject.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChild_1.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_2.id,
        },
      ]);
      expect(actualHierarchy).toHaveLength(3);

      // WHEN searching for the parents of the subject SkillGroup by its id
      const actualFoundParents = await repository.findParents(givenModelId, givenSubject.id, 10);

      const expectedParents: ISkillGroup[] = [
        { ...givenParent, children: [expectedSkillGroupReference(givenSubject), expectedSkillReference(givenChild_2)] },
      ];

      // THEN expect the SkillGroup to be found as a parent
      expect(actualFoundParents).toEqual(expectedParents);
    });
    test("should return an empty array if no parents are found", async () => {
      // GIVEN a SkillGroup exists without a parent
      const givenModelId = getMockStringId(1);
      const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, "group");
      const givenSkillGroup = await repository.create(givenSkillGroupSpecs);

      // WHEN searching for it's parents by ti's id
      const actualFoundParents = await repository.findParents(givenModelId, givenSkillGroup.id, 10);
      // THEN expect an empty array to be returned
      expect(actualFoundParents).toEqual([]);
    });
    test("should return [] if the children given id is not valid object id", async () => {
      // GIVEN No SkillGroup exists in the database
      // WHEN searching for the SkillGroup parents by it's id
      const actualFoundSkillGroupParents = await repository.findParents(
        getMockStringId(1),
        "non_existing_child_id",
        10
      );

      // THEN expect no SkillGroup parents to be found
      expect(actualFoundSkillGroupParents).toEqual([]);
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.findParents(getMockStringId(1), getMockStringId(2), 10);
    });
    test("should paginate parents with limit and cursor", async () => {
      const givenModelId = getMockStringId(1);
      const parent1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "p1"));
      const parent2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "p2"));
      const parent3 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "p3"));
      const child = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "child"));
      await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent1.id,
          childType: ObjectTypes.SkillGroup,
          childId: child.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent2.id,
          childType: ObjectTypes.SkillGroup,
          childId: child.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent3.id,
          childType: ObjectTypes.SkillGroup,
          childId: child.id,
        },
      ]);

      const firstPage = await repository.findParents(givenModelId, child.id, 2);
      expect(firstPage).toHaveLength(2);
      const secondPage = await repository.findParents(givenModelId, child.id, 2, firstPage[1].id);
      expect(secondPage).toHaveLength(1);
      expect(secondPage[0].id).toBe(parent3.id);
    });
  });

  describe("Test findChildren()", () => {
    test("should find a SkillGroup children by parentId", async () => {
      // GIVEN three SkillGroups and one Skill exists in the database in the same model
      const givenModelId = getMockStringId(1);

      // The root parent (SkillGroup)
      const givenParentSpecs = getSimpleNewSkillGroupSpec(givenModelId, "parent");
      const givenParent = await repository.create(givenParentSpecs);
      // The 2nd level parent (SkillGroup)
      const givenChildSpecs_1 = getSimpleNewSkillGroupSpec(givenModelId, "subject");
      const givenChild_1 = await repository.create(givenChildSpecs_1);
      // the child (SkillGroup)
      const givenChildSpecs_2 = getSimpleNewSkillGroupSpec(givenModelId, "child_1");
      const givenChild_2 = await repository.create(givenChildSpecs_2);
      // the child (Skill)
      const givenChildSpecs_3 = getSimpleNewSkillSpec(givenModelId, "child_2");
      const givenChild_3 = await repositoryRegistry.skill.create(givenChildSpecs_3);
      // AND the hierarchy is parent -> subject -> child_1 and parent -> child_2
      const actualHierarchy = await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChild_1.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenChild_1.id,
          childType: ObjectTypes.SkillGroup,
          childId: givenChild_2.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParent.id,
          childType: ObjectTypes.Skill,
          childId: givenChild_3.id,
        },
      ]);
      expect(actualHierarchy).toHaveLength(3);
      const actualFoundChildren = await repository.findChildren(givenModelId, givenParent.id, 10);

      const expectedChildren = [
        {
          id: givenChild_1.id,
          parentId: givenParent.id,
          UUID: givenChild_1.UUID,
          UUIDHistory: givenChild_1.UUIDHistory,
          originUri: givenChild_1.originUri,
          description: givenChild_1.description,
          preferredLabel: givenChild_1.preferredLabel,
          altLabels: givenChild_1.altLabels,
          code: givenChild_1.code,
          objectType: ObjectTypes.SkillGroup,
          modelId: givenChild_1.modelId,
          createdAt: givenChild_1.createdAt,
          updatedAt: givenChild_1.updatedAt,
        },
        {
          id: givenChild_3.id,
          parentId: givenParent.id,
          UUID: givenChild_3.UUID,
          UUIDHistory: givenChild_3.UUIDHistory,
          originUri: givenChild_3.originUri,
          description: givenChild_3.description,
          preferredLabel: givenChild_3.preferredLabel,
          altLabels: givenChild_3.altLabels,
          isLocalized: givenChild_3.isLocalized,
          objectType: ObjectTypes.Skill,
          modelId: givenChild_3.modelId,
          createdAt: givenChild_3.createdAt,
          updatedAt: givenChild_3.updatedAt,
        },
      ];

      // THEN expect the children to be found
      expect(actualFoundChildren).toHaveLength(2);
      expect(actualFoundChildren).toEqual(expectedChildren);
    });
    test("should return [] if no children for the given SkillGroup with the given parent id are found", async () => {
      // GIVEN a SkillGroup exists without children
      const givenModelId = getMockStringId(1);
      const givenSkillGroupSpecs = getSimpleNewSkillGroupSpec(givenModelId, "group");
      const givenSkillGroup = await repository.create(givenSkillGroupSpecs);
      const actualFoundChildren = await repository.findChildren(givenModelId, givenSkillGroup.id, 10);
      // THEN expect no children to be found
      expect(actualFoundChildren).toHaveLength(0);
      expect(actualFoundChildren).toEqual([]);
    });
    test("should return [] if the parent given id is not a valid object id", async () => {
      // GIVEN No SkillGroup exists in the database
      // WHEN searching for the SkillGroup children by a non-valid id
      const actualFoundChildren = await repository.findChildren(getMockStringId(1), "non_existing_parent_id", 10);

      // THEN expect no children to be found
      expect(actualFoundChildren).toHaveLength(0);
      expect(actualFoundChildren).toEqual([]);
    });
    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.findChildren(getMockStringId(1), getMockStringId(2), 10);
    });
    test("should paginate children with limit and cursor", async () => {
      const givenModelId = getMockStringId(1);
      const parent = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "parent"));
      const child1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "c1"));
      const child2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "c2"));
      const child3 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "c3"));
      await repositoryRegistry.skillHierarchy.createMany(givenModelId, [
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent.id,
          childType: ObjectTypes.SkillGroup,
          childId: child1.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent.id,
          childType: ObjectTypes.SkillGroup,
          childId: child2.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: parent.id,
          childType: ObjectTypes.SkillGroup,
          childId: child3.id,
        },
      ]);

      const firstPage = await repository.findChildren(givenModelId, parent.id, 2);
      expect(firstPage).toHaveLength(2);
      const secondPage = await repository.findChildren(givenModelId, parent.id, 2, firstPage[1].id);
      expect(secondPage).toHaveLength(1);
      expect(secondPage[0].id).toBe(child3.id);
    });
  });

  describe("Test findHistoryReferencesByUUIDs()", () => {
    test("should resolve each UUID to its skill group reference + modelId, preserving input order and null-filling misses", async () => {
      // GIVEN two skill groups in different models
      const givenModelId1 = getMockStringId(1);
      const givenModelId2 = getMockStringId(2);
      const givenGroup1 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId1, "group_1"));
      const givenGroup2 = await repository.create(getSimpleNewSkillGroupSpec(givenModelId2, "group_2"));
      const givenMissingUUID = randomUUID();

      // WHEN resolving a set of UUIDs that includes both groups' UUIDs plus a non-existent UUID
      const actual = await repository.findHistoryReferencesByUUIDs([
        givenGroup1.UUID,
        givenMissingUUID,
        givenGroup2.UUID,
      ]);

      // THEN expect one entry per input UUID in input order, with the reference + modelId for matches and nulls for the miss
      expect(actual).toEqual([
        {
          UUID: givenGroup1.UUID,
          modelId: givenModelId1,
          reference: {
            id: givenGroup1.id,
            UUID: givenGroup1.UUID,
            code: givenGroup1.code,
            preferredLabel: givenGroup1.preferredLabel,
            objectType: ObjectTypes.SkillGroup,
          },
        },
        { UUID: givenMissingUUID, modelId: null, reference: null },
        {
          UUID: givenGroup2.UUID,
          modelId: givenModelId2,
          reference: {
            id: givenGroup2.id,
            UUID: givenGroup2.UUID,
            code: givenGroup2.code,
            preferredLabel: givenGroup2.preferredLabel,
            objectType: ObjectTypes.SkillGroup,
          },
        },
      ]);
    });

    test("should null-fill every entry when none of the given UUIDs match a skill group", async () => {
      // GIVEN a skill group exists
      await repository.create(getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1"));
      const givenUUIDs = [randomUUID(), randomUUID()];

      // WHEN resolving UUIDs that do not match any skill group
      const actual = await repository.findHistoryReferencesByUUIDs(givenUUIDs);

      // THEN expect a null-filled entry per input UUID
      expect(actual).toEqual(givenUUIDs.map((uuid) => ({ UUID: uuid, modelId: null, reference: null })));
    });

    test("should return an empty array when given an empty list of UUIDs", async () => {
      // GIVEN a skill group exists
      await repository.create(getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1"));

      // WHEN resolving an empty list of UUIDs
      const actual = await repository.findHistoryReferencesByUUIDs([]);

      // THEN expect an empty array
      expect(actual).toEqual([]);
    });

    test("should use the UUID index and not do a collection scan", async () => {
      // GIVEN two skill groups exist in the database
      const givenGroup1 = await repository.create(getSimpleNewSkillGroupSpec(getMockStringId(1), "group_1"));
      const givenGroup2 = await repository.create(getSimpleNewSkillGroupSpec(getMockStringId(2), "group_2"));

      // WHEN resolving their UUIDs
      // setup find with explain to assert the query plan uses the UUID index and is not doing a collection scan
      const actualPlans = setUpFindWithExplain<ISkillGroupDoc>(repository.Model);
      await repository.findHistoryReferencesByUUIDs([givenGroup1.UUID, givenGroup2.UUID]);

      // THEN expect the query plan to use the UUID index
      await expect(actualPlans).resolves.toHaveLength(1);
      await expect(actualPlans).resolves.toEqual(
        expect.arrayContaining([
          getExpectedPlan({
            collectionName: repository.Model.collection.name,
            filter: { UUID: { $in: [givenGroup1.UUID, givenGroup2.UUID] } },
            usedIndex: { UUID: 1 },
            withProjection: true,
          }),
        ])
      );
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      return repositoryRegistry.skillGroup.findHistoryReferencesByUUIDs([randomUUID()]);
    });
  });

  describe("Test update() skill group ", () => {
    test("should successfully update an existing SkillGroup with new values", async () => {
      // GIVEN a SkillGroup exists in the database
      const givenModelId = getMockStringId(1);
      const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(givenModelId, "group_1");
      const givenSkillGroup = await repository.create(givenSkillGroupSpec);

      // AND new values to update
      const givenUpdateSpec: IUpdateSkillGroupSpec = {
        code: getTestSkillGroupCode(200),
        preferredLabel: "Updated Label",
        altLabels: ["updated-alt-1"],
        description: "Updated description",
        scopeNote: "Updated scope note",
        originUri: "https://updated.example.com",
        modelId: givenModelId,
        UUIDHistory: [randomUUID()],
      };

      // WHEN updating the SkillGroup
      const actualUpdated = await repository.update(givenSkillGroup.id, givenModelId, givenUpdateSpec);

      // THEN expect the updated SkillGroup to have the new values
      expect(actualUpdated).not.toBeNull();
      expect(actualUpdated!.id).toEqual(givenSkillGroup.id);
      expect(actualUpdated!.code).toEqual(givenUpdateSpec.code);
      expect(actualUpdated!.preferredLabel).toEqual("Updated Label");
      expect(actualUpdated!.altLabels).toEqual(["updated-alt-1"]);
      expect(actualUpdated!.description).toEqual("Updated description");
      expect(actualUpdated!.scopeNote).toEqual("Updated scope note");
      expect(actualUpdated!.originUri).toEqual("https://updated.example.com");
      // AND expect the UUIDHistory to be replaced
      expect(actualUpdated!.UUIDHistory).toEqual(givenUpdateSpec.UUIDHistory);
      // AND expect the timestamps to be updated
      expect(actualUpdated!.updatedAt.getTime()).toBeGreaterThanOrEqual(givenSkillGroup.updatedAt.getTime());
    });

    test("should preserve a non fallback language translation of a field when updating it", async () => {
      // GIVEN a SkillGroup exists in the database
      const givenModelId = getMockStringId(1);
      const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "group_1"));
      // AND its preferredLabel also carries a French translation, stored directly (the flat-string repository API
      // has no way to write a non fallback language)
      await repository.Model.updateOne({ _id: givenSkillGroup.id }, { $set: { "preferredLabel.fr": "Gestion" } });

      // WHEN updating the SkillGroup, setting only the fallback language through the public API
      const givenUpdateSpec: IUpdateSkillGroupSpec = {
        code: givenSkillGroup.code,
        preferredLabel: "Updated Label",
        altLabels: ["updated-alt-1"],
        description: "Updated description",
        scopeNote: "Updated scope note",
        originUri: "https://updated.example.com",
        modelId: givenModelId,
        UUIDHistory: givenSkillGroup.UUIDHistory,
      };
      await repository.update(givenSkillGroup.id, givenModelId, givenUpdateSpec);

      // THEN expect the fallback language to have been updated, and the French translation to still be there
      const actualRawDoc = await repository.Model.findById(givenSkillGroup.id).lean();
      const expectedFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
      expect(actualRawDoc?.preferredLabel).toEqual({
        [expectedFallbackDbKeyName]: givenUpdateSpec.preferredLabel,
        fr: "Gestion",
      });
    });

    test("should return null if the SkillGroup with the given id does not exist", async () => {
      // GIVEN no SkillGroup with the given id exists
      const givenModelId = getMockStringId(1);
      const givenUpdateSpec: IUpdateSkillGroupSpec = {
        code: getTestSkillGroupCode(100),
        preferredLabel: "Label",
        altLabels: [],
        description: "Desc",
        scopeNote: "ScopeNote",
        originUri: "https://example.com",
        modelId: givenModelId,
        UUIDHistory: [randomUUID()],
      };

      // WHEN updating a non-existent SkillGroup
      const actualUpdated = await repository.update(getMockStringId(999), givenModelId, givenUpdateSpec);

      // THEN expect null to be returned
      expect(actualUpdated).toBeNull();
    });

    test("should return null if the given id is not a valid ObjectId", async () => {
      // GIVEN an invalid id
      const givenModelId = getMockStringId(1);
      const givenUpdateSpec: IUpdateSkillGroupSpec = {
        code: getTestSkillGroupCode(100),
        preferredLabel: "Label",
        altLabels: [],
        description: "Desc",
        scopeNote: "ScopeNote",
        originUri: "https://example.com",
        modelId: givenModelId,
        UUIDHistory: [randomUUID()],
      };

      // WHEN updating with an invalid id
      const actualUpdated = await repository.update("invalid_id", givenModelId, givenUpdateSpec);

      // THEN expect null to be returned
      expect(actualUpdated).toBeNull();
    });

    test("should return null if the SkillGroup exists but belongs to a different model", async () => {
      // GIVEN a SkillGroup in model A
      const givenModelIdA = getMockStringId(1);
      const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelIdA, "group_1"));

      // WHEN updating with a different modelId
      const givenModelIdB = getMockStringId(2);
      const givenUpdateSpec: IUpdateSkillGroupSpec = {
        code: getTestSkillGroupCode(100),
        preferredLabel: "Label",
        altLabels: [],
        description: "Desc",
        scopeNote: "ScopeNote",
        originUri: "https://example.com",
        modelId: givenModelIdB,
        UUIDHistory: [randomUUID()],
      };
      const actualUpdated = await repository.update(givenSkillGroup.id, givenModelIdB, givenUpdateSpec);

      // THEN expect null to be returned (no match for the given modelId)
      expect(actualUpdated).toBeNull();
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      const givenSpec: IUpdateSkillGroupSpec = {
        code: getTestSkillGroupCode(100),
        preferredLabel: "Label",
        altLabels: [],
        description: "Desc",
        scopeNote: "ScopeNote",
        originUri: "https://example.com",
        modelId: getMockStringId(1),
        UUIDHistory: [randomUUID()],
      };
      return repositoryRegistry.skillGroup.update(getMockStringId(1), getMockStringId(1), givenSpec);
    });
  });

  describe("Test patch() skill group ", () => {
    test("should successfully patch an existing SkillGroup with partial values", async () => {
      // GIVEN a SkillGroup exists in the database
      const givenModelId = getMockStringId(1);
      const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelId, "group_1"));

      // WHEN patching with only preferredLabel and scopeNote
      const givenPatchSpec: IPartialUpdateSkillGroupSpec = {
        preferredLabel: "Patched Label",
        scopeNote: "Patched scope note",
      };
      const actualPatched = await repository.patch(givenSkillGroup.id, givenModelId, givenPatchSpec);

      // THEN expect only the specified fields to be updated, others remain unchanged
      expect(actualPatched).not.toBeNull();
      expect(actualPatched!.id).toEqual(givenSkillGroup.id);
      expect(actualPatched!.preferredLabel).toEqual("Patched Label");
      expect(actualPatched!.scopeNote).toEqual("Patched scope note");
      // AND expect the other fields to remain unchanged
      expect(actualPatched!.code).toEqual(givenSkillGroup.code);
      expect(actualPatched!.altLabels).toEqual(givenSkillGroup.altLabels);
      expect(actualPatched!.description).toEqual(givenSkillGroup.description);
      expect(actualPatched!.originUri).toEqual(givenSkillGroup.originUri);
      expect(actualPatched!.UUIDHistory).toEqual(givenSkillGroup.UUIDHistory);
      // AND expect the timestamps to be updated
      expect(actualPatched!.updatedAt.getTime()).toBeGreaterThanOrEqual(givenSkillGroup.updatedAt.getTime());
    });

    test("should preserve a non fallback language translation of a field when patching it, and leave other translatable fields untouched", async () => {
      // GIVEN a SkillGroup exists in the database
      const givenModelId = getMockStringId(1);
      const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(givenModelId, "group_1");
      givenSkillGroupSpec.description = "A description of the group";
      const givenSkillGroup = await repository.create(givenSkillGroupSpec);
      // AND its preferredLabel and description also carry a French translation, stored directly (the flat-string
      // repository API has no way to write a non fallback language)
      await repository.Model.updateOne(
        { _id: givenSkillGroup.id },
        { $set: { "preferredLabel.fr": "Gestion", "description.fr": "Une description" } }
      );

      // WHEN patching only preferredLabel through the public API
      const givenPatchSpec: IPartialUpdateSkillGroupSpec = { preferredLabel: "Patched Label" };
      await repository.patch(givenSkillGroup.id, givenModelId, givenPatchSpec);

      // THEN expect preferredLabel's fallback language to have been updated, and its French translation preserved
      const actualRawDoc = await repository.Model.findById(givenSkillGroup.id).lean();
      const expectedFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
      expect(actualRawDoc?.preferredLabel).toEqual({
        [expectedFallbackDbKeyName]: "Patched Label",
        fr: "Gestion",
      });
      // AND expect description, which was not part of the patch, to be completely untouched
      expect(actualRawDoc?.description).toEqual({
        [expectedFallbackDbKeyName]: givenSkillGroup.description,
        fr: "Une description",
      });
    });

    test("should return null if the SkillGroup with the given id does not exist", async () => {
      // GIVEN no SkillGroup with the given id exists
      const givenModelId = getMockStringId(1);
      const givenPatchSpec: IPartialUpdateSkillGroupSpec = {
        preferredLabel: "Patched Label",
      };

      // WHEN patching a non-existent SkillGroup
      const actualPatched = await repository.patch(getMockStringId(999), givenModelId, givenPatchSpec);

      // THEN expect null to be returned
      expect(actualPatched).toBeNull();
    });

    test("should return null if the given id is not a valid ObjectId", async () => {
      // GIVEN an invalid id
      const givenModelId = getMockStringId(1);
      const givenPatchSpec: IPartialUpdateSkillGroupSpec = {
        preferredLabel: "Patched Label",
      };

      // WHEN patching with an invalid id
      const actualPatched = await repository.patch("invalid_id", givenModelId, givenPatchSpec);

      // THEN expect null to be returned
      expect(actualPatched).toBeNull();
    });

    test("should return null if the SkillGroup exists but belongs to a different model", async () => {
      // GIVEN a SkillGroup in model A
      const givenModelIdA = getMockStringId(1);
      const givenSkillGroup = await repository.create(getSimpleNewSkillGroupSpec(givenModelIdA, "group_1"));

      // WHEN patching with a different modelId
      const givenModelIdB = getMockStringId(2);
      const givenPatchSpec: IPartialUpdateSkillGroupSpec = {
        preferredLabel: "Patched Label",
      };
      const actualPatched = await repository.patch(givenSkillGroup.id, givenModelIdB, givenPatchSpec);

      // THEN expect null to be returned (no match for the given modelId)
      expect(actualPatched).toBeNull();
    });

    TestDBConnectionFailureNoSetup<unknown>((repositoryRegistry) => {
      const givenSpec: IPartialUpdateSkillGroupSpec = {
        preferredLabel: "Label",
      };
      return repositoryRegistry.skillGroup.patch(getMockStringId(1), getMockStringId(1), givenSpec);
    });
  });
});
