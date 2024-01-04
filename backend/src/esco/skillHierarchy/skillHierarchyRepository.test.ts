// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";

import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ISkillHierarchyRepository } from "./skillHierarchyRepository";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkill } from "esco/skill/skills.types";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "./skillHierarchy.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import {
  getSimpleNewISCOGroupSpec,
  getSimpleNewESCOOccupationSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  TestDBConnectionFailure,
  TestStreamDBConnectionFailureNoSetup,
} from "_test_utilities/testDBConnectionFaillure";
import { expectedSkillGroupReference, expectedSkillReference } from "esco/_test_utilities/expectedReference";
import * as HandleInsertManyErrors from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";

describe("Test the SkillHierarchy Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: ISkillHierarchyRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillHierarchyRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.skillHierarchy;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  afterEach(async () => {
    await cleanupDBCollections();
  });

  async function cleanupDBCollections() {
    if (repository) {
      await Promise.all([
        repository.hierarchyModel.deleteMany({}).exec(),
        repository.skillModel.deleteMany({}).exec(),
        repository.skillGroupModel.deleteMany({}).exec(),
      ]);
    }
  }

  /** Helper function to create n simple SkillHierarchy in the db,
   * @param modelId
   * @param batchSize
   */
  async function createSkillHierarchiesInDB(modelId: string, batchSize: number = 3) {
    const newSkillHierarchyPairSpecs: INewSkillHierarchyPairSpec[] = [];
    for (let i = 0; i < batchSize; i++) {
      const skillGroup = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(modelId, `skillGroup_${i}`)
      );
      const skill = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(modelId, `skill_${i + 1}`));
      newSkillHierarchyPairSpecs.push({
        parentId: skillGroup.id,
        parentType: ObjectTypes.SkillGroup,
        childId: skill.id,
        childType: ObjectTypes.Skill,
      });
    }
    return await repository.createMany(modelId, newSkillHierarchyPairSpecs);
  }

  test("should return the model", async () => {
    expect(repository.hierarchyModel).toBeDefined();
  });

  test("initOnce has registered the SkillHierarchyRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().skillHierarchy).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test createMany()", () => {
    afterEach(async () => {
      for (const collection of Object.values(dbConnection.collections)) {
        await collection.deleteMany({});
      }
    });

    beforeEach(async () => {
      for (const collection of Object.values(dbConnection.collections)) {
        await collection.deleteMany({});
      }
    });

    test("should successfully create the hierarchy of the SkillGroups", async () => {
      // GIVEN 4 SkillGroups exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenGroup_1_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_1")
      );
      const givenGroup_1_2 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_2")
      );
      const givenGroup_1_2_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_2_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_2.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          parentId: givenGroup_1_2.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_2_1.id,
          childType: ObjectTypes.SkillGroup,
        },
      ];

      // WHEN updating the hierarchy of the SkillGroups
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewSkillHierarchy).toEqual(
        expect.arrayContaining(
          givenNewHierarchySpecs.map<ISkillHierarchyPair>((newSpec: INewSkillHierarchyPairSpec) => {
            return {
              ...newSpec,
              parentDocModel: MongooseModelName.SkillGroup,
              childDocModel: MongooseModelName.SkillGroup,
              id: expect.any(String),
              modelId: givenModelId,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            };
          })
        )
      );
      // AND  to have the expected hierarchy
      const actualGroup_1 = await repositoryRegistry.skillGroup.findById(givenGroup_1.id);
      const expected: ISkillGroup = {
        ...givenGroup_1,
        children: [expectedSkillGroupReference(givenGroup_1_1), expectedSkillGroupReference(givenGroup_1_2)],
        parents: [],
        updatedAt: expect.any(Date),
      };
      expect(actualGroup_1).toEqual(expected);
      const actualGroup_1_1 = await repositoryRegistry.skillGroup.findById(givenGroup_1_1.id);
      expect(actualGroup_1_1).toEqual({
        ...givenGroup_1_1,
        children: [],
        parents: expect.arrayContaining([expectedSkillGroupReference(givenGroup_1)]),
        updatedAt: expect.any(Date),
      } as ISkillGroup);
      const actualGroup_1_2 = await repositoryRegistry.skillGroup.findById(givenGroup_1_2.id);
      expect(actualGroup_1_2).toEqual({
        ...givenGroup_1_2,
        children: [expectedSkillGroupReference(givenGroup_1_2_1)],
        parents: expect.arrayContaining([expectedSkillGroupReference(givenGroup_1)]),
        updatedAt: expect.any(Date),
      } as ISkillGroup);
      const actualGroup_1_2_1 = await repositoryRegistry.skillGroup.findById(givenGroup_1_2_1.id);
      expect(actualGroup_1_2_1).toEqual({
        ...givenGroup_1_2_1,
        children: [],
        parents: expect.arrayContaining([expectedSkillGroupReference(givenGroup_1_2)]),
        updatedAt: expect.any(Date),
      } as ISkillGroup);
    });

    test("should successfully create the hierarchy of Skills", async () => {
      // GIVEN 4 SkillGroups exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenSkill_1_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1_1"));
      const givenSkill_1_1_1 = await repositoryRegistry.skill.create(
        getSimpleNewSkillSpec(givenModelId, "skill_1_1_1")
      );
      const givenSkill_1_2_1 = await repositoryRegistry.skill.create(
        getSimpleNewSkillSpec(givenModelId, "skill_1_2_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenSkill_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenSkill_1_1.id,
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenSkill_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenSkill_1_1_1.id,
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenSkill_1_1_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenSkill_1_2_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN updating the hierarchy of the SkillGroups
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewSkillHierarchy).toEqual(
        expect.arrayContaining(
          givenNewHierarchySpecs.map<ISkillHierarchyPair>((newSpec: INewSkillHierarchyPairSpec) => {
            return {
              ...newSpec,
              parentDocModel: MongooseModelName.Skill,
              childDocModel: MongooseModelName.Skill,
              id: expect.any(String),
              modelId: givenModelId,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            };
          })
        )
      );
      // AND to have the expected hierarchy
      const actual_skill_1 = await repositoryRegistry.skill.findById(givenSkill_1.id);
      expect(actual_skill_1).toEqual({
        ...givenSkill_1,
        children: [expectedSkillReference(givenSkill_1_1), expectedSkillReference(givenSkill_1_1_1)],
        parents: [],
        updatedAt: expect.any(Date),
      } as ISkill);
      const actual_skill_1_1 = await repositoryRegistry.skill.findById(givenSkill_1_1.id);
      expect(actual_skill_1_1).toEqual({
        ...givenSkill_1_1,
        children: [],
        parents: expect.arrayContaining([expectedSkillReference(givenSkill_1)]),
        updatedAt: expect.any(Date),
      } as ISkill);
      const actual_skill_1_2 = await repositoryRegistry.skill.findById(givenSkill_1_1_1.id);
      expect(actual_skill_1_2).toEqual({
        ...givenSkill_1_1_1,
        children: [expectedSkillReference(givenSkill_1_2_1)],
        parents: expect.arrayContaining([expectedSkillReference(givenSkill_1)]),
        updatedAt: expect.any(Date),
      } as ISkill);
      const actual_skill_1_2_1 = await repositoryRegistry.skill.findById(givenSkill_1_2_1.id);
      expect(actual_skill_1_2_1).toEqual({
        ...givenSkill_1_2_1,
        children: [],
        parents: expect.arrayContaining([expectedSkillReference(givenSkill_1_1_1)]),
        updatedAt: expect.any(Date),
      } as ISkill);
    });

    test("should successfully create the hierarchy of SkillGroups/Skills", async () => {
      // GIVEN a SkillGroup and a Skill exist in the database, in the same model
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN updating the hierarchy of the SkillGroups
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewSkillHierarchy).toEqual(
        expect.arrayContaining([
          {
            ...givenNewHierarchySpecs[0],
            parentDocModel: MongooseModelName.SkillGroup,
            childDocModel: MongooseModelName.Skill,
            id: expect.any(String),
            modelId: givenModelId,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ])
      );
      // AND to have the expected hierarchy
      const actualGroup_1 = await repositoryRegistry.skillGroup.findById(givenGroup_1.id);
      expect(actualGroup_1).toEqual({
        ...givenGroup_1,
        parents: [],
        children: [expectedSkillReference(givenSkill_1)],
        updatedAt: expect.any(Date),
      } as ISkillGroup);

      const actualSkill_1 = await repositoryRegistry.skill.findById(givenSkill_1.id);
      expect(actualSkill_1).toEqual({
        ...givenSkill_1,
        children: [],
        parents: expect.arrayContaining([expectedSkillGroupReference(givenGroup_1)]),
        updatedAt: expect.any(Date),
      } as ISkill);
    });

    test("should successfully update the hierarchy even if some don't validate", async () => {
      // GIVEN 3 SkillGroups exist in the database
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenGroup_1_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_1")
      );
      const givenGroup_1_1_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_1_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          // valid
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          // invalid
          //@ts-ignore
          foo: "invalid-property", // <--- should not validate
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_1_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          // invalid <-- duplicate
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          // valid
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1_1_1.id,
          childType: ObjectTypes.SkillGroup,
        },
      ];

      // WHEN updating the hierarchy of the SkillGroups
      // AND the second hierarchy entry creates duplicate and should violate the unique constraint
      // AND the third hierarchy entry does validate
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect the first and the fourth to be created
      expect(actualNewSkillHierarchy).toHaveLength(2);
      expect(actualNewSkillHierarchy).toEqual(
        expect.arrayContaining(
          [givenNewHierarchySpecs[0], givenNewHierarchySpecs[3]].map<ISkillHierarchyPair>(
            (newSpec: INewSkillHierarchyPairSpec) => {
              return {
                ...newSpec,
                parentDocModel: MongooseModelName.SkillGroup,
                childDocModel: MongooseModelName.SkillGroup,
                id: expect.any(String),
                modelId: givenModelId,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
              };
            }
          )
        )
      );
    });

    test("should not add duplicate entries", async () => {
      // GIVEN 1 SkillGroup and Skills exist in the database in the same model
      // AND linked with a parent-child relationship
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      const handleInsertManyErrorSpy = jest.spyOn(HandleInsertManyErrors, "handleInsertManyError");
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN updating the hierarchy of the SkillGroups
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);
      // THEN expect only the first entity to be created
      expect(actualNewSkillHierarchy).toHaveLength(1);
      // AND expect the error handler function to have been called
      expect(handleInsertManyErrorSpy).toHaveBeenCalled();
      // AND expect the created entry to be valid
      expect(actualNewSkillHierarchy[0]).toEqual({
        ...givenNewHierarchySpecs[0],
        id: expect.any(String),
        modelId: givenModelId,
        childDocModel: MongooseModelName.Skill,
        parentDocModel: MongooseModelName.SkillGroup,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      // cleanup the mock
      handleInsertManyErrorSpy.mockRestore();
    });

    test("should throw an error if the modelId is invalid", async () => {
      // GIVEN an invalid modelId
      const givenModelId = "not-a-valid-id";

      // WHEN creating a new hierarchy with an invalid modelId
      const actualHierarchyPromise = repository.createMany(givenModelId, []);

      // Then expect the promise to reject with an error
      await expect(actualHierarchyPromise).rejects.toThrowError(`Invalid modelId: ${givenModelId}`);
    });

    test("should ignore entries that refer to not existing objects", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in the same model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: getMockStringId(1),
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: getMockStringId(2),
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN creating a new hierarchy with an entry that refers to a non-existing parent
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries that refer to objects that are not in the same model", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in that model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN creating a new hierarchy that refers in a different model that the one the entries exist
      const actualNewSkillHierarchy = await repository.createMany(getMockStringId(2), givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent and child are the same", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in that model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          parentId: givenSkill_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN creating a new hierarchy that parents and child are the same
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parentType does not match the existingParentType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in that model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.Skill, // <-- does not match the existingParentType
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where childType does not match the existingChildType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in that model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkill_1.id,
          childType: ObjectTypes.SkillGroup, // <-- does not match the existingChildType
        },
      ];

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parent is skill and child is group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup and a Skill exist in the database, in that model
      const givenGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenSkill_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenGroup_1.id,
          childType: ObjectTypes.SkillGroup,
        },
      ];

      // WHEN creating a new hierarchy where the parent is skill and the child is an SkillGroup
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent is not skill or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 SkillGroup, 1 Skill  and 1 SkillGroup and a Skill exist in the database in that model
      const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenISCOGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenISCOGroup_1.id,
          // @ts-ignore
          parentType: ObjectTypes.SkillGroup,
          childId: givenSkillGroup_1.id,
          childType: ObjectTypes.SkillGroup,
        },
        {
          parentId: givenOccupation_1.id,
          // @ts-ignore
          parentType: ObjectTypes.Skill,
          childId: givenSkill_1.id,
          childType: ObjectTypes.Skill,
        },
      ];

      // WHEN creating a new hierarchy where the parent in not skill or a SkillGroup
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the child is not skill or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND a SkillGroup, a Skill and a SkillGroup and a Skill exist in the database, in the same model
      const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenISCOGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "ISCOGroup_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewESCOOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
        {
          parentId: givenSkill_1.id,
          parentType: ObjectTypes.Skill,
          childId: givenOccupation_1.id,
          // @ts-ignore
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenSkillGroup_1.id,
          parentType: ObjectTypes.SkillGroup,
          childId: givenISCOGroup_1.id,
          // @ts-ignore
          childType: ObjectTypes.SkillGroup,
        },
      ];

      // WHEN creating a new hierarchy where the child is not skill or SkillGroup
      const actualNewSkillHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewSkillHierarchy).toHaveLength(0);
    });

    type SetupResult = {
      givenModelId: string;
      givenNewHierarchySpecs: INewSkillHierarchyPairSpec[];
    };

    TestDBConnectionFailure<SetupResult, unknown>(
      async (repositoryRegistry) => {
        // GIVEN 4 SkillGroups exist in the database in the same model
        const givenModelId = getMockStringId(1);
        const givenGroup_1 = await repositoryRegistry.skillGroup.create(
          getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
        );
        const givenGroup_1_1 = await repositoryRegistry.skillGroup.create(
          getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_1")
        );
        const givenGroup_1_2 = await repositoryRegistry.skillGroup.create(
          getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_2")
        );
        const givenGroup_1_2_1 = await repositoryRegistry.skillGroup.create(
          getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1_2_1")
        );
        // AND the following hierarchy
        const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [
          {
            parentId: givenGroup_1.id,
            parentType: ObjectTypes.SkillGroup,
            childId: givenGroup_1_1.id,
            childType: ObjectTypes.SkillGroup,
          },
          {
            parentId: givenGroup_1.id,
            parentType: ObjectTypes.SkillGroup,
            childId: givenGroup_1_2.id,
            childType: ObjectTypes.SkillGroup,
          },
          {
            parentId: givenGroup_1_2.id,
            parentType: ObjectTypes.SkillGroup,
            childId: givenGroup_1_2_1.id,
            childType: ObjectTypes.SkillGroup,
          },
        ];
        return {
          givenModelId,
          givenNewHierarchySpecs,
        };
      },
      async (setupResult, repositoryRegistry) => {
        return repositoryRegistry.skillHierarchy.createMany(
          setupResult.givenModelId,
          setupResult.givenNewHierarchySpecs
        );
      }
    );
  });

  describe("Test findAll()", () => {
    test("should find all skillHierarchies in the given model", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND a set of skillHierarchies exist in the database
      const givenNewSkillHierarchies = await createSkillHierarchiesInDB(givenModelId);
      // AND some others exist for a different model
      await createSkillHierarchiesInDB(getMockStringId(2));

      // WHEN finding all skillHierarchies for the given modelId
      const actualSkillHierarchies = repository.findAll(givenModelId);

      // THEN expect all the skillHierarchies to be returned as a consumable stream
      const actualSkillHierarchiesArray: ISkillHierarchyPair[] = [];
      for await (const data of actualSkillHierarchies) {
        actualSkillHierarchiesArray.push(data);
      }
      expect(actualSkillHierarchiesArray).toEqual(givenNewSkillHierarchies);
    });

    test("should not return any entry when the given model does not have any skillHierarchy but other models do", async () => {
      // GIVEN some modelId
      const givenModelId = getMockStringId(1);
      // AND some skillHierarchies exist in the database for a different model
      await createSkillHierarchiesInDB(getMockStringId(2));

      // WHEN finding all skillHierarchies for the given modelId
      const actualSkillHierarchies = repository.findAll(givenModelId);

      // THEN expect no skillHierarchies to be returned
      const actualSkillHierarchiesArray: ISkillHierarchyPair[] = [];
      for await (const data of actualSkillHierarchies) {
        actualSkillHierarchiesArray.push(data);
      }
      expect(actualSkillHierarchiesArray).toHaveLength(0);
    });

    test("should handle errors during data retrieval", async () => {
      // GIVEN that an error will occur when retrieving data
      const givenError = new Error("foo");
      jest.spyOn(repository.hierarchyModel, "find").mockImplementationOnce(() => {
        throw givenError;
      });

      // WHEN finding all skillHierarchies for some modelId
      const actualSkillHierarchies = () => repository.findAll(getMockStringId(1));

      // THEN expect the operation to fail with the given error
      expect(actualSkillHierarchies).toThrow(
        expect.toMatchErrorWithCause("SkillHierarchyRepository.findAll: findAll failed", givenError.message)
      );
    });

    test("should end and emit an error if an error occurs during data retrieval in the upstream", async () => {
      // GIVEN that an error will occur during the streaming of data
      const givenError = new Error("foo");
      const mockStream = Readable.from([{ toObject: jest.fn() }]);
      mockStream._read = jest.fn().mockImplementation(() => {
        throw givenError;
      });
      const mockFind = jest.spyOn(repository.hierarchyModel, "find");
      // @ts-ignore
      mockFind.mockReturnValue({
        cursor: jest.fn().mockReturnValueOnce(mockStream),
      });

      // WHEN finding all skillHierarchies for some modelId
      const actualStream = repository.findAll(getMockStringId(1));

      // THEN expect the operation to return a stream that emits an error
      const actualSkillHierarchies: ISkillHierarchyPair[] = [];
      await expect(async () => {
        for await (const data of actualStream) {
          actualSkillHierarchies.push(data);
        }
      }).rejects.toThrowError(givenError);
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("SkillHierarchyRepository.findAll: stream failed", givenError.message)
      );
      expect(actualStream.closed).toBeTruthy();
      expect(actualSkillHierarchies).toHaveLength(0);
      mockFind.mockRestore();
    });

    TestStreamDBConnectionFailureNoSetup((repositoryRegistry) =>
      repositoryRegistry.skillHierarchy.findAll(getMockStringId(1))
    );
  });
});
