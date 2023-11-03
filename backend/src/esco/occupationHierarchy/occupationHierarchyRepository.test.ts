// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";

import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry, RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { IOccupationHierarchyRepository } from "./occupationHierarchyRepository";
import { ObjectTypes } from "esco/common/objectTypes";
import { IISCOGroup } from "esco/iscoGroup/ISCOGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupation, OccupationType } from "esco/occupation/occupation.types";
import { INewOccupationHierarchyPairSpec, IOccupationHierarchyPair } from "./occupationHierarchy.types";
import {
  getSimpleNewISCOGroupSpec,
  getSimpleNewOccupationSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { TestDBConnectionFailure } from "_test_utilities/testDBConnectionFaillure";
import { expectedISCOGroupReference, expectedOccupationReference } from "esco/_test_utilities/expectedReference";
import * as HandleInsertManyErrors from "esco/common/handleInsertManyErrors";

describe("Test the OccupationHierarchy Repository with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repository: IOccupationHierarchyRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationHierarchyRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
    repository = repositoryRegistry.occupationHierarchy;
  });

  afterAll(async () => {
    if (dbConnection) {
      console.log("Closing db connection");
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  test("should return the model", async () => {
    expect(repository.hierarchyModel).toBeDefined();
  });

  test("initOnce has registered the OccupationHierarchyRepository", async () => {
    // GIVEN the environment mongo db uri is set
    expect(process.env.MONGODB_URI).toBeDefined();

    // WHEN initOnce has been called
    await initOnce();

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().occupationHierarchy).toBeDefined();

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

    test.each([
      ["ISCO group", ObjectTypes.ISCOGroup, [ObjectTypes.ISCOGroup, OccupationType.ESCO, OccupationType.LOCAL]],
      ["ESCO occupation", OccupationType.ESCO, [OccupationType.ESCO, OccupationType.LOCAL]],
      ["Local occupation", OccupationType.LOCAL, [OccupationType.LOCAL]],
    ])(
      "should successfully create the hierarchy of %s with multiple children",
      async (
        description: string,
        parentType: ObjectTypes | OccupationType,
        childrenTypes: (ObjectTypes | OccupationType)[]
      ) => {
        const givenModelId = getMockStringId(1);

        const createEntityFromType = (type: ObjectTypes | OccupationType) => {
          switch (type) {
            case ObjectTypes.ISCOGroup:
              return repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
            case OccupationType.ESCO:
              return repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
            case OccupationType.LOCAL:
              return repositoryRegistry.occupation.create(
                getSimpleNewOccupationSpec(givenModelId, "occupation_1", true)
              );
            default:
              throw new Error(`Unexpected type: ${type}`);
          }
        };
        const findEntityFromType = (type: ObjectTypes | OccupationType, id: string) => {
          switch (type) {
            case ObjectTypes.ISCOGroup:
              return repositoryRegistry.ISCOGroup.findById(id);
            case OccupationType.ESCO:
            case OccupationType.LOCAL:
              return repositoryRegistry.occupation.findById(id);
            default:
              throw new Error(`Unexpected type: ${type}`);
          }
        };
        // GIVEN a parent and children that exist in the same model
        const givenParent = await createEntityFromType(parentType);
        const givenChildren = await Promise.all(childrenTypes.map((type) => createEntityFromType(type)));
        // AND the following hierarchy
        const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = givenChildren.map((child, index) => ({
          parentId: givenParent.id,
          parentType: parentType in OccupationType ? ObjectTypes.Occupation : ObjectTypes.ISCOGroup,
          childId: child.id,
          childType: childrenTypes[index] in OccupationType ? ObjectTypes.Occupation : ObjectTypes.ISCOGroup,
        }));

        // WHEN updating the hierarchy
        const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

        // THEN expect all the Hierarchy entries to be created
        expect(actualNewOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);

        // AND to have the expected hierarchy
        const actualParent = await findEntityFromType(parentType, givenParent.id);
        expect(actualParent).toEqual({
          ...givenParent,
          parent: null,
          children: givenChildren.map((child, index) =>
            childrenTypes[index] in OccupationType
              ? expectedOccupationReference(child as IOccupation)
              : expectedISCOGroupReference(child as IISCOGroup)
          ),
          updatedAt: expect.any(Date),
        } as IISCOGroup);

        const actualChildren = await Promise.all(
          givenChildren.map((child, index) => findEntityFromType(childrenTypes[index], child.id))
        );
        actualChildren.forEach((actualChild, index) => {
          expect(actualChild).toEqual({
            ...givenChildren[index],
            children: [],
            parent:
              parentType in OccupationType
                ? expectedOccupationReference(givenParent as IOccupation)
                : expectedISCOGroupReference(givenParent as IISCOGroup),
            updatedAt: expect.any(Date),
          } as IOccupation);
        });
      }
    );

    test("should successfully update the hierarchy even if some don't validate", async () => {
      // GIVEN 3 ISCOGroups exist in the database
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenGroup_1_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1_1")
      );
      const givenGroup_1_1_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1_1_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          // valid
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenGroup_1_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
        {
          // invalid
          //@ts-ignore
          foo: "invalid-property", // <--- should not validate
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenGroup_1_1_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
        {
          // invalid <--- is duplicate
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenGroup_1_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
        {
          // valid
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenGroup_1_1_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
      ];

      // WHEN updating the hierarchy of the ISCOGroups
      // AND the second hierarchy entry creates duplicate and should violate the unique constraint
      // AND the third hierarchy entry does validate
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect the first and the fourth to be created
      expect(actualNewOccupationHierarchy).toHaveLength(2);
      expect(actualNewOccupationHierarchy).toEqual(
        expect.arrayContaining(
          [givenNewHierarchySpecs[0], givenNewHierarchySpecs[3]].map<IOccupationHierarchyPair>(
            (newSpec: INewOccupationHierarchyPairSpec) => {
              return {
                ...newSpec,
                parentDocModel: MongooseModelName.ISCOGroup,
                childDocModel: MongooseModelName.ISCOGroup,
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
      // GIVEN 1 ISCOGroup and Occupations exist in the database in the same model
      // AND linked with a parent-child relationship
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const handleInsertManyErrorSpy = jest.spyOn(HandleInsertManyErrors, "handleInsertManyError");

      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN updating the hierarchy of the ISCOGroups
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);
      // THEN expect only the first entry to be created.
      expect(actualNewOccupationHierarchy).toHaveLength(1);
      // AND expect the error handler function to have been called
      expect(handleInsertManyErrorSpy).toHaveBeenCalled();
      // AND expect the created entry to be valid
      expect(actualNewOccupationHierarchy[0]).toEqual({
        ...givenNewHierarchySpecs[0],
        id: expect.any(String),
        modelId: givenModelId,
        childDocModel: MongooseModelName.Occupation,
        parentDocModel: MongooseModelName.ISCOGroup,
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
      // AND 1 ISCOGroup and 1 Occupation exist in the database in the same model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: getMockStringId(1),
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: getMockStringId(2),
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN creating a new hierarchy with an entry that refers to a non-existing parent
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries that refer to objects that are not in the same model", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup and 1 Occupation exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN creating a new hierarchy that refers in a different model that the one the entries exist
      const actualNewOccupationHierarchy = await repository.createMany(getMockStringId(2), givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent and child are the same", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup and 1 Occupation exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenGroup_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN creating a new hierarchy that parents and child are the same
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parentType does not match the existingParentType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup and 1 Occupation exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.Occupation, // <-- does not match the existingParentType
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where childType does not match the existingChildType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup and 1 Occupation exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.ISCOGroup, // <-- does not match the existingChildType
        },
      ];

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parent is occupation and child is group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup and 1 Occupation exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenGroup_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
      ];

      // WHEN creating a new hierarchy where the parent is occupation and the child is an ISCOGroup
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent is not occupation or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup, 1 Occupation  and 1 SkillGroup and a Skill exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenSkillGroup_1.id,
          // @ts-ignore
          parentType: ObjectTypes.SkillGroup,
          childId: givenGroup_1.id,
          childType: ObjectTypes.ISCOGroup,
        },
        {
          parentId: givenSkill_1.id,
          // @ts-ignore
          parentType: ObjectTypes.Skill,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN creating a new hierarchy where the parent in not occupation or a ISCOGroup
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the child is not occupation or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockStringId(1);
      // AND 1 ISCOGroup, 1 Occupation  and 1 SkillGroup and a Skill exist in the database in that model
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenSkillGroup_1 = await repositoryRegistry.skillGroup.create(
        getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1")
      );
      const givenSkill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenSkill_1.id,
          // @ts-ignore
          childType: ObjectTypes.Skill,
        },
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenSkillGroup_1.id,
          // @ts-ignore
          childType: ObjectTypes.SkillGroup,
        },
      ];

      // WHEN creating a new hierarchy where the child is not occupation or ISCOGroup
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent is a local occupation and the child is an esco occupation", async () => {
      // GIVEN 2 Occupations exist in the database in the same model
      const givenModelId = getMockStringId(1);
      // AND the parent occupation is a local occupation
      const occupation_1_spec = getSimpleNewOccupationSpec(givenModelId, "occupation_1", true); //<---- this is the inconsistency
      const givenOccupation_1 = await repositoryRegistry.occupation.create(occupation_1_spec);
      // AND the child occupation is an esco occupation
      const givenOccupation_1_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenOccupation_1_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];
      // WHEN updating the hierarchy of the ISCOGroups
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      console.log(actualNewOccupationHierarchy);
      // THEN expect no Hierarchy entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(0);
    });

    test.todo("FUTURE: should ignore entries that would lead to a cyclic hierarchy");

    type SetupResult = {
      givenModelId: string;
      givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[];
    };

    TestDBConnectionFailure<SetupResult, unknown>(
      async (repositoryRegistry) => {
        // GIVEN 4 ISCOGroups exist in the database in the same model
        const givenModelId = getMockStringId(1);
        const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
          getSimpleNewISCOGroupSpec(givenModelId, "group_1")
        );
        const givenGroup_1_1 = await repositoryRegistry.ISCOGroup.create(
          getSimpleNewISCOGroupSpec(givenModelId, "group_1_1")
        );
        const givenGroup_1_2 = await repositoryRegistry.ISCOGroup.create(
          getSimpleNewISCOGroupSpec(givenModelId, "group_1_2")
        );
        const givenGroup_1_2_1 = await repositoryRegistry.ISCOGroup.create(
          getSimpleNewISCOGroupSpec(givenModelId, "group_1_2_1")
        );
        // AND the following hierarchy
        const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
          {
            parentId: givenGroup_1.id,
            parentType: ObjectTypes.ISCOGroup,
            childId: givenGroup_1_1.id,
            childType: ObjectTypes.ISCOGroup,
          },
          {
            parentId: givenGroup_1.id,
            parentType: ObjectTypes.ISCOGroup,
            childId: givenGroup_1_2.id,
            childType: ObjectTypes.ISCOGroup,
          },
          {
            parentId: givenGroup_1_2.id,
            parentType: ObjectTypes.ISCOGroup,
            childId: givenGroup_1_2_1.id,
            childType: ObjectTypes.ISCOGroup,
          },
        ];
        return {
          givenModelId,
          givenNewHierarchySpecs,
        };
      },
      (setupResult, repositoryRegistry) => {
        return repositoryRegistry.occupationHierarchy.createMany(
          setupResult.givenModelId,
          setupResult.givenNewHierarchySpecs
        );
      }
    );
  });
});
