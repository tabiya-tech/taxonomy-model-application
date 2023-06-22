// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import {getMockId} from "_test_utilities/mockMongoId";
import {Connection} from "mongoose";

import {getNewConnection} from "server/connection/newConnection";
import {getRepositoryRegistry, RepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import {getTestConfiguration} from "_test_utilities/getTestConfiguration";
import {IOccupationHierarchyRepository} from "./occupationHierarchyRepository";
import {getMockRandomISCOGroupCode} from "_test_utilities/mockISCOCode";
import {ObjectTypes} from "esco/common/objectTypes";
import {IISCOGroup, IISCOGroupReference, INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";
import {MongooseModelName} from "esco/common/mongooseModelNames";
import {INewOccupationSpec, IOccupation, IOccupationReference} from "esco/occupation/occupation.types";
import {getMockRandomOccupationCode} from "_test_utilities/mockOccupationCode";
import {INewOccupationHierarchyPairSpec, IOccupationHierarchyPair} from "./occupationHierarchy.types";
import {INewSkillGroupSpec} from "esco/skillGroup/skillGroup.types";
import {getMockRandomSkillCode} from "_test_utilities/mockSkillGroupCode";
import {INewSkillSpec} from "esco/skill/skills.types";

function getSimpleNewISCOGroupSpec(modelId: string, preferredLabel: string): INewISCOGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: ""
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
    regulatedProfessionNote: ""
  };
}

function getSimpleNewSkillGroupSpec(modelId: string, preferredLabel: string): INewSkillGroupSpec {
  return {
    code: getMockRandomSkillCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: "",
    scopeNote: "",
    altLabels: [],
  };
}


function getSimpleNewSkillSpec(modelId: string, preferredLabel: string): INewSkillSpec {
  return {
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    definition: "",
    description: "",
    scopeNote: "",
    skillType: "knowledge",
    reuseLevel: "cross-sector",
    altLabels: [],
  }
}

/**
 *  Create an expected ISCOGroup reference from a given ISCOGroup
 * @param iscoGroup
 */
function expectedISCOGroupReference(iscoGroup: IISCOGroup): IISCOGroupReference {
  return {
    id: iscoGroup.id,
    UUID: iscoGroup.UUID,
    objectType: ObjectTypes.ISCOGroup,
    code: iscoGroup.code,
    preferredLabel: iscoGroup.preferredLabel,
  }
}

/**
 *  Create an expected IOccupation reference from a given ISCOGroup
 * @param occupation
 */
function expectedOccupationReference(occupation: IOccupation): IOccupationReference {
  return {
    id: occupation.id,
    UUID: occupation.UUID,
    objectType: ObjectTypes.Occupation,
    code: occupation.code,
    ISCOGroupCode: occupation.ISCOGroupCode,
    preferredLabel: occupation.preferredLabel,
  }
}

describe("Test the OccupationHierarchy Repository with an in-memory mongodb", () => {

  let dbConnection: Connection;
  let repository: IOccupationHierarchyRepository;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationHierarchyRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry()
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
    await initOnce()

    // THEN expect the repository to be defined
    expect(getRepositoryRegistry().occupationHierarchy).toBeDefined();

    // Clean up
    await getConnectionManager().getCurrentDBConnection()!.close(false); // do not force close as there might be pending mongo operations
  });

  describe("Test createMany()", () => {

    afterEach(async () => {
      await repository.hierarchyModel.deleteMany({}).exec();
    })
    beforeEach(async () => {
      await repository.hierarchyModel.deleteMany({}).exec();
    })

    test("should successfully create the hierarchy of the ISCO Groups", async () => {
      // GIVEN 4 ISCO Groups exist in the database in the same model
      const givenModelId = getMockId(1);
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const group_1_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1_1"));
      const group_1_2 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1_2"));
      const group_1_2_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1_2_1"));
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_1.id,
          childType: ObjectTypes.ISCOGroup
        },
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_2.id,
          childType: ObjectTypes.ISCOGroup
        },
        {
          parentId: group_1_2.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_2_1.id,
          childType: ObjectTypes.ISCOGroup
        },
      ]

      // WHEN updating the hierarchy of the ISCO Groups
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(newOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(newOccupationHierarchy).toEqual(
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
      const actual_group_1 = await repositoryRegistry.ISCOGroup.findById(group_1.id);
      expect(actual_group_1).toEqual({
        ...group_1,
        children: [expectedISCOGroupReference(group_1_1), expectedISCOGroupReference(group_1_2)],
        parent: null,
        updatedAt: expect.any(Date),
      })
      const actual_group_1_1 = await repositoryRegistry.ISCOGroup.findById(group_1_1.id);
      expect(actual_group_1_1).toEqual({
        ...group_1_1,
        children: [],
        parent: expectedISCOGroupReference(group_1),
        updatedAt: expect.any(Date),
      })
      const actual_group_1_2 = await repositoryRegistry.ISCOGroup.findById(group_1_2.id);
      expect(actual_group_1_2).toEqual({
        ...group_1_2,
        children: [expectedISCOGroupReference(group_1_2_1)],
        parent: expectedISCOGroupReference(group_1),
        updatedAt: expect.any(Date),
      })
      const actual_group_1_2_1 = await repositoryRegistry.ISCOGroup.findById(group_1_2_1.id);
      expect(actual_group_1_2_1).toEqual({
        ...group_1_2_1,
        children: [],
        parent: expectedISCOGroupReference(group_1_2),
        updatedAt: expect.any(Date),
      })

    })

    test("should successfully create the hierarchy of Occupations", async () => {
      // GIVEN 4 ISCO Groups exist in the database in the same model
      const givenModelId = getMockId(1);
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
      const occupation_1_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1_1"));
      const occupation_1_1_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1_1_1"));
      const occupation_1_2_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1_2_1"));
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: occupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: occupation_1_1.id,
          childType: ObjectTypes.Occupation
        },
        {
          parentId: occupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: occupation_1_1_1.id,
          childType: ObjectTypes.Occupation
        },
        {
          parentId: occupation_1_1_1.id,
          parentType: ObjectTypes.Occupation,
          childId: occupation_1_2_1.id,
          childType: ObjectTypes.Occupation
        },
      ]

      // WHEN updating the hierarchy of the ISCO Groups
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(newOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(newOccupationHierarchy).toEqual(
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

      // AND  to have the expected hierarchy
      const actual_occupation_1 = await repositoryRegistry.occupation.findById(occupation_1.id);
      expect(actual_occupation_1).toEqual({
        ...occupation_1,
        children: [expectedOccupationReference(occupation_1_1), expectedOccupationReference(occupation_1_1_1)],
        parent: null,
        updatedAt: expect.any(Date),
      })
      const actual_occupation_1_1 = await repositoryRegistry.occupation.findById(occupation_1_1.id);
      expect(actual_occupation_1_1).toEqual({
        ...occupation_1_1,
        children: [],
        parent: expectedOccupationReference(occupation_1),
        updatedAt: expect.any(Date),
      })
      const actual_occupation_1_2 = await repositoryRegistry.occupation.findById(occupation_1_1_1.id);
      expect(actual_occupation_1_2).toEqual({
        ...occupation_1_1_1,
        children: [expectedOccupationReference(occupation_1_2_1)],
        parent: expectedOccupationReference(occupation_1),
        updatedAt: expect.any(Date),
      })
      const actual_occupation_1_2_1 = await repositoryRegistry.occupation.findById(occupation_1_2_1.id);
      expect(actual_occupation_1_2_1).toEqual({
        ...occupation_1_2_1,
        children: [],
        parent: expectedOccupationReference(occupation_1_1_1),
        updatedAt: expect.any(Date),
      })
    });

    test("should successfully create the hierarchy of ISCO Groups/Occupations", async () => {
      // GIVEN 1 ISCO Group and an Occupation exist in the database in the same model
      const givenModelId = getMockId(1);
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ]

      // WHEN updating the hierarchy of the ISCO Groups
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect all the Hierarchy entries to be created
      expect(newOccupationHierarchy).toHaveLength(givenNewHierarchySpecs.length);
      expect(newOccupationHierarchy).toEqual(
        expect.arrayContaining(
          [{
            ...givenNewHierarchySpecs[0],
            parentDocModel: MongooseModelName.ISCOGroup,
            childDocModel: MongooseModelName.Occupation,
            id: expect.any(String),
            modelId: givenModelId,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }]
        )
      );

      // AND  to have the expected hierarchy
      const actual_group_1 = await repositoryRegistry.ISCOGroup.findById(group_1.id);
      expect(actual_group_1).toEqual({
        ...group_1,
        parent: null,
        children: [expectedOccupationReference(occupation_1)],
        updatedAt: expect.any(Date),
      })

      const actual_occupation_1 = await repositoryRegistry.occupation.findById(occupation_1.id);
      expect(actual_occupation_1).toEqual({
        ...occupation_1,
        children: [],
        parent: expectedISCOGroupReference(group_1),
        updatedAt: expect.any(Date),
      })
    });

    test("should successfully update the hierarchy even if some don't validate", async () => {
      // GIVEN 3 ISCO Groups exist in the database
      const givenModelId = getMockId(1);
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const group_1_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1_1"));
      const group_1_1_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1_1_1"));

      // WHEN updating the hierarchy of the ISCO Groups
      // AND the second hierarchy entry creates duplicate and should violate the unique constraint
      // AND the third hierarchy entry does validate

      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        { // valid
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_1.id,
          childType: ObjectTypes.ISCOGroup
        }, { // invalid
          //@ts-ignore
          foo: "invalid-property", // <--- should not validate
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_1_1.id,
          childType: ObjectTypes.ISCOGroup
        },
        { // invalid
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_1.id,
          childType: ObjectTypes.ISCOGroup
        },
        { // valid
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1_1_1.id,
          childType: ObjectTypes.ISCOGroup
        },
      ]
      // WHEN updating the hierarchy of the ISCO Groups
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect the first and the fourth to be created
      expect(newOccupationHierarchy).toHaveLength(2);
      expect(newOccupationHierarchy).toEqual(
        expect.arrayContaining(
          [givenNewHierarchySpecs[0], givenNewHierarchySpecs[3]].map<IOccupationHierarchyPair>((newSpec: INewOccupationHierarchyPairSpec) => {
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

    });

    test("should not add duplicate entries", async () => {
      // GIVEN 1 ISCO Group and  Occupations exist in the database in the same model
      // AND linked with a parent-child relationship
      const givenModelId = getMockId(1);
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
      // AND the following hierarchy
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ]
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);
      expect(newOccupationHierarchy).toHaveLength(1);

      // WHEN adding the same hierarchy again
      const newOccupationHierarchy_2 = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy_2).toHaveLength(0);
    });

    test("should throw an error if the modelId is invalid", async () => {
      // WHEN creating a new hierarchy with an invalid modelId
      const givenModelId = "not-a-valid-id";
      const hierarchyPromise = repository.createMany(givenModelId, []);

      // THEN expect an error to be thrown
      await expect(hierarchyPromise).rejects.toThrowError(`Invalid modelId: ${givenModelId}`);
    })

    test("should ignore entries that refer to not existing objects", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in the same model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy with an entry that refers to a non-existing parent
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: getMockId(1),
          parentType: ObjectTypes.ISCOGroup,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        },
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: getMockId(2),
          childType: ObjectTypes.Occupation
        }
      ];
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries that refer to objects that are not in the same model", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy that refers in a different model that the one the entries exist
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ];
      const newOccupationHierarchy = await repository.createMany(getMockId(2), givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent and child are the same", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy that parents and child are the same
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: group_1.id,
          childType: ObjectTypes.ISCOGroup
        },
        {
          parentId: occupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ];
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parentType does not match the existingParentType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.Occupation, // <-- does not match the existingParentType
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ];
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where childType does not match the existingChildType", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy that the parent does not the existing object's parentType
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: occupation_1.id,
          childType: ObjectTypes.ISCOGroup // <-- does not match the existingChildType
        }
      ];
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where parent is occupation and child is group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group and 1 Occupation exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));

      // WHEN creating a new hierarchy where the parent is occupation and the child is an ISCO group
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: occupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: group_1.id,
          childType: ObjectTypes.ISCOGroup
        }
      ];
      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the parent is not occupation or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group, 1 Occupation  and 1 SkillGroup and a Skill exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
      const skillGroup_1 = await repositoryRegistry.skillGroup.create(getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1"));
      const skill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      // WHEN creating a new hierarchy where the parent in not occupation or a ISCO group
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: skillGroup_1.id,
          // @ts-ignore
          parentType: ObjectTypes.SkillGroup,
          childId: group_1.id,
          childType: ObjectTypes.ISCOGroup
        },
        {
          parentId: skill_1.id,
          // @ts-ignore
          parentType: ObjectTypes.Skill,
          childId: occupation_1.id,
          childType: ObjectTypes.Occupation
        }
      ];

      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test("should ignore entries where the child is not occupation or a group", async () => {
      // GIVEN a valid modelId
      const givenModelId = getMockId(1);
      // AND 1 ISCO Group, 1 Occupation  and 1 SkillGroup and a Skill exist in the database in that model
      const group_1 = await repositoryRegistry.ISCOGroup.create(getSimpleNewISCOGroupSpec(givenModelId, "group_1"));
      const occupation_1 = await repositoryRegistry.occupation.create(getSimpleNewOccupationSpec(givenModelId, "occupation_1"));
      const skillGroup_1 = await repositoryRegistry.skillGroup.create(getSimpleNewSkillGroupSpec(givenModelId, "skillGroup_1"));
      const skill_1 = await repositoryRegistry.skill.create(getSimpleNewSkillSpec(givenModelId, "skill_1"));

      // WHEN creating a new hierarchy where the child is not occupation or ISCO group
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
        {
          parentId: occupation_1.id,
          parentType: ObjectTypes.Occupation,
          childId: skill_1.id,
          // @ts-ignore
          childType: ObjectTypes.Skill
        },
        {
          parentId: group_1.id,
          parentType: ObjectTypes.ISCOGroup,
          childId: skillGroup_1.id,
          // @ts-ignore
          childType: ObjectTypes.SkillGroup
        }
      ];

      const newOccupationHierarchy = await repository.createMany(givenModelId, givenNewHierarchySpecs);

      // THEN expect no new entries to be created
      expect(newOccupationHierarchy).toHaveLength(0);
    });

    test.todo("FUTURE: should ignore entries that would lead to a cyclic hierarchy")

    // Testing connection failure with the insetMany() is currently not possible,
    // as there no easy way to simulate a connection failure.
    // Force closing the connection will throw an uncaught exception instead of the operation rejecting.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // Other ways of simulating the connection failure e.g, start/stopping the in memory mongo instance,
    // will cause the test to wait for quite some time, as there is no way to set a maxTime of the insertMany() operation.
    // This seems to be a limitation of the current version of the MongoDB driver.
    // TestConnectionFailure((repository) => {
    //    return repository.createMany([getNewISCOGroupSpec()]);
    //  });
  });
});