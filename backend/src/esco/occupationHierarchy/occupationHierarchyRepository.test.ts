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
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { ObjectTypes } from "esco/common/objectTypes";
import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { INewOccupationSpec, IOccupation } from "esco/occupation/occupation.types";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { INewOccupationHierarchyPairSpec, IOccupationHierarchyPair } from "./occupationHierarchy.types";
import { getSimpleNewSkillGroupSpec, getSimpleNewSkillSpec } from "esco/_test_utilities/getNewSpecs";
import { TestDBConnectionFailure } from "_test_utilities/testDBConnectionFaillure";
import { expectedISCOGroupReference, expectedOccupationReference } from "esco/_test_utilities/expectedReference";
import * as HandleInsertManyErrors from "esco/common/handleInsertManyErrors";

function getSimpleNewISCOGroupSpec(modelId: string, preferredLabel: string): INewISCOGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: "",
    importId: "",
  };
}

function getSimpleNewOccupationSpec(modelId: string, preferredLabel: string): INewOccupationSpec {
  return {
    altLabels: [],
    code: getMockRandomOccupationCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    ESCOUri: "",
    description: "",
    definition: "",
    scopeNote: "",
    regulatedProfessionNote: "",
    importId: "",
  };
}

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

    test("should successfully create the hierarchy of the ISCOGroups", async () => {
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

      // WHEN updating the hierarchy of the ISCOGroups
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewOccupationHierarchy).toEqual(
        expect.arrayContaining(
          givenNewHierarchySpecs.map<IOccupationHierarchyPair>((newSpec: INewOccupationHierarchyPairSpec) => {
            return {
              ...newSpec,
              parentDocModel: MongooseModelName.ISCOGroup,
              childDocModel: MongooseModelName.ISCOGroup,
              id: expect.any(String),
              modelId: givenModelId,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            };
          })
        )
      );
      // AND  to have the expected hierarchy
      const actualGroup_1 = await repositoryRegistry.ISCOGroup.findById(givenGroup_1.id);
      expect(actualGroup_1).toEqual({
        ...givenGroup_1,
        children: [expectedISCOGroupReference(givenGroup_1_1), expectedISCOGroupReference(givenGroup_1_2)],
        parent: null,
        updatedAt: expect.any(Date),
      } as IISCOGroup);
      const actualGroup_1_1 = await repositoryRegistry.ISCOGroup.findById(givenGroup_1_1.id);
      expect(actualGroup_1_1).toEqual({
        ...givenGroup_1_1,
        children: [],
        parent: expectedISCOGroupReference(givenGroup_1),
        updatedAt: expect.any(Date),
      } as IISCOGroup);
      const actualGroup_1_2 = await repositoryRegistry.ISCOGroup.findById(givenGroup_1_2.id);
      expect(actualGroup_1_2).toEqual({
        ...givenGroup_1_2,
        children: [expectedISCOGroupReference(givenGroup_1_2_1)],
        parent: expectedISCOGroupReference(givenGroup_1),
        updatedAt: expect.any(Date),
      } as IISCOGroup);
      const actualGroup_1_2_1 = await repositoryRegistry.ISCOGroup.findById(givenGroup_1_2_1.id);
      expect(actualGroup_1_2_1).toEqual({
        ...givenGroup_1_2_1,
        children: [],
        parent: expectedISCOGroupReference(givenGroup_1_2),
        updatedAt: expect.any(Date),
      } as IISCOGroup);
    });

    test("should successfully create the hierarchy of Occupations", async () => {
      // GIVEN 4 ISCOGroups exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      const givenOccupation_1_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1_1")
      );
      const givenOccupation_1_1_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1_1_1")
      );
      const givenOccupation_1_2_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1_2_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenOccupation_1_1.id,
          childType: ObjectTypes.Occupation,
        },
        {
          parentId: givenOccupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenOccupation_1_1_1.id,
          childType: ObjectTypes.Occupation,
        },
        {
          parentId: givenOccupation_1_1_1.id,
          parentType: ObjectTypes.Occupation,
          childId: givenOccupation_1_2_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN updating the hierarchy of the ISCOGroups
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewOccupationHierarchy).toEqual(
        expect.arrayContaining(
          givenNewHierarchySpecs.map<IOccupationHierarchyPair>((newSpec: INewOccupationHierarchyPairSpec) => {
            return {
              ...newSpec,
              parentDocModel: MongooseModelName.Occupation,
              childDocModel: MongooseModelName.Occupation,
              id: expect.any(String),
              modelId: givenModelId,
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            };
          })
        )
      );
      // AND to have the expected hierarchy
      const actual_occupation_1 = await repositoryRegistry.occupation.findById(givenOccupation_1.id);
      expect(actual_occupation_1).toEqual({
        ...givenOccupation_1,
        children: [
          expectedOccupationReference(givenOccupation_1_1),
          expectedOccupationReference(givenOccupation_1_1_1),
        ],
        parent: null,
        updatedAt: expect.any(Date),
      } as IISCOGroup);
      const actual_occupation_1_1 = await repositoryRegistry.occupation.findById(givenOccupation_1_1.id);
      expect(actual_occupation_1_1).toEqual({
        ...givenOccupation_1_1,
        children: [],
        parent: expectedOccupationReference(givenOccupation_1),
        updatedAt: expect.any(Date),
      } as IOccupation);
      const actual_occupation_1_2 = await repositoryRegistry.occupation.findById(givenOccupation_1_1_1.id);
      expect(actual_occupation_1_2).toEqual({
        ...givenOccupation_1_1_1,
        children: [expectedOccupationReference(givenOccupation_1_2_1)],
        parent: expectedOccupationReference(givenOccupation_1),
        updatedAt: expect.any(Date),
      } as IOccupation);
      const actual_occupation_1_2_1 = await repositoryRegistry.occupation.findById(givenOccupation_1_2_1.id);
      expect(actual_occupation_1_2_1).toEqual({
        ...givenOccupation_1_2_1,
        children: [],
        parent: expectedOccupationReference(givenOccupation_1_1_1),
        updatedAt: expect.any(Date),
      } as IOccupation);
    });

    test("should successfully create the hierarchy of ISCO Groups/Occupations", async () => {
      // GIVEN 1 ISCOGroup and an Occupation exist in the database in the same model
      const givenModelId = getMockStringId(1);
      const givenGroup_1 = await repositoryRegistry.ISCOGroup.create(
        getSimpleNewISCOGroupSpec(givenModelId, "group_1")
      );
      const givenOccupation_1 = await repositoryRegistry.occupation.create(
        getSimpleNewOccupationSpec(givenModelId, "occupation_1")
      );
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: givenGroup_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: givenOccupation_1.id,
          childType: ObjectTypes.Occupation,
        },
      ];

      // WHEN updating the hierarchy of the ISCOGroups
      const actualNewOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(actualNewOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(actualNewOccupationHierarchy).toEqual(
        expect.arrayContaining([
          {
            ...givenNewHierarchySpecs[0],
            parentDocModel: MongooseModelName.ISCOGroup,
            childDocModel: MongooseModelName.Occupation,
            id: expect.any(String),
            modelId: givenModelId,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ])
      );
      // AND to have the expected hierarchy
      const actualGroup_1 = await repositoryRegistry.ISCOGroup.findById(givenGroup_1.id);
      expect(actualGroup_1).toEqual({
        ...givenGroup_1,
        parent: null,
        children: [expectedOccupationReference(givenOccupation_1)],
        updatedAt: expect.any(Date),
      } as IISCOGroup);

      const actualOccupation_1 = await repositoryRegistry.occupation.findById(givenOccupation_1.id);
      expect(actualOccupation_1).toEqual({
        ...givenOccupation_1,
        children: [],
        parent: expectedISCOGroupReference(givenGroup_1),
        updatedAt: expect.any(Date),
      } as IOccupation);
    });

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
