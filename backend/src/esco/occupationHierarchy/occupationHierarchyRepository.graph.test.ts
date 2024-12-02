import "_test_utilities/consoleMock";

import { ObjectTypes } from "esco/common/objectTypes";
import { INewOccupationHierarchyPairSpec } from "esco/occupationHierarchy/occupationHierarchy.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getNewConnection } from "server/connection/newConnection";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationHierarchyRepository } from "./occupationHierarchyRepository";
import { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { INewOccupationGroupSpec, IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";
import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation.types";

/*
* This test constructs a graph structure with varying relationship dynamics and tests the rules for creating a hierarchy
* The graph structure comes from a hierarchy graph designed to test all the interactions we thought would be relevant to test
* You can find the graph by following the link: https://lucid.app/publicSegments/view/8d6d1a3c-b6a5-426c-9ad4-73041b3d9dc6/image.png
* */

// Utility functions to create specs with specific codes
function createISCOGroupSpec(modelId: string, code: string, preferredLabel: string): INewOccupationGroupSpec {
  return {
    altLabels: [],
    code: code,
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    groupType: ObjectTypes.ISCOGroup,
    description: "",
    importId: getMockStringId(Math.random() * 1000),
  };
}

function createLocalGroupSpec(modelId: string, code: string, preferredLabel: string): INewOccupationGroupSpec {
  return {
    altLabels: [],
    code: code,
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    groupType: ObjectTypes.LocalGroup,
    description: "",
    importId: getMockStringId(Math.random() * 1000),
  };
}

function createESCOOccupationSpec(
  modelId: string,
  code: string,
  groupCode: string,
  preferredLabel: string
): INewOccupationSpec {
  return {
    occupationGroupCode: groupCode,
    code: code,
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    description: "",
    importId: getMockStringId(Math.random() * 1000),
    isLocalized: false,
    occupationType: ObjectTypes.ESCOOccupation,
  };
}

function createLocalOccupationSpec(
  modelId: string,
  code: string,
  groupCode: string,
  preferredLabel: string
): INewOccupationSpec {
  return {
    occupationGroupCode: groupCode,
    code: code,
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    description: "",
    importId: getMockStringId(Math.random() * 1000),
    isLocalized: false,
    occupationType: ObjectTypes.LocalOccupation,
  };
}

describe("Test the OccupationHierarchy Repository graph structure", () => {
  let dbConnection: Connection;
  let repository: IOccupationHierarchyRepository;
  let repositoryRegistry: RepositoryRegistry;

  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("OccupationHierarchyRepositoryGraphTestDB");
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

  afterEach(async () => {
    await cleanupDBCollections();
  });

  async function cleanupDBCollections() {
    if (repository) {
      await Promise.all([
        repository.hierarchyModel.deleteMany({}).exec(),
        repository.occupationGroupModel.deleteMany({}).exec(),
        repository.occupationModel.deleteMany({}).exec(),
      ]);
    }
  }

  test("should create large hierarchy with varying relationship dynamics with ISCOGroup as root node (1st Graph)", async () => {
    // GIVEN a model
    const givenModelId = getMockStringId(1);
    const givenLocalGroups: IOccupationGroup[] = [];
    const givenISCOGroups: IOccupationGroup[] = [];
    const givenESCOOccupations: IOccupation[] = [];
    const givenLocalOccupations: IOccupation[] = [];

    // AND a root level ISCOGroup with code 0
    const ISCOGroup_0 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "0", "ISCOGroup: 0")
    );
    givenISCOGroups.push(ISCOGroup_0);
    // AND a 1st level ISCOGroup with code 01
    const ISCOGroup_01 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "01", "ISCOGroup: 01")
    );
    givenISCOGroups.push(ISCOGroup_01);

    // We are not able to test the case this entity belongs to yet
    // AND a LocalOccupation under the root level ISCOGroup with a code that does not match the parent code (0_1} //INVALID
    // const LocalOccupation_0_1 = await repositoryRegistry.occupation.create(
    //   createLocalOccupationSpec(givenModelId, `${ISCOGroup_0.code}_1`, ISCOGroup_0.code, "LocalOccupation: 0_1")
    // );

    // AND an ESCOOccupation under the root level ISCOGroup with a code that does not match the parent code (0000.1) //INVALID
    const ESCOOccupation_0000_1 = await repositoryRegistry.occupation.create(
      // an esco occupation with code 0.1 cannot be created here, so we are creating one that is valid, but still should not be allowed to create a hierarchy
      createESCOOccupationSpec(
        givenModelId,
        `${ISCOGroup_0.code.padStart(4, "0")}.1`,
        ISCOGroup_0.code,
        "ESCOOccupation: 0.1"
      )
    );
    givenESCOOccupations.push(ESCOOccupation_0000_1);
    // AND a LocalGroup with code ABC (invalid)
    const LocalGroup_ABC = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "ABC", "LocalGroup: ABC")
    );
    givenLocalGroups.push(LocalGroup_ABC);
    // AND a 2nd level ISCOGroup with code 011
    const ISCOGroup_011 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "011", "ISCOGroup: 011")
    );
    givenISCOGroups.push(ISCOGroup_011);
    // AND a 2nd level local group with code 01A
    const LocalGroup_01A = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "01A", "LocalGroup: 01A")
    );
    givenLocalGroups.push(LocalGroup_01A);
    // AND a 2nd level isco group with a code that does not match the parent code (02) //INVALID
    const ISCOGroup_021 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "021", "ISCOGroup: 011")
    );
    givenISCOGroups.push(ISCOGroup_021);
    // AND a 2nd level local group with a code that does not match the parent code (0B) //INVALID
    const LocalGroup_0B = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, `0B`, "LocalGroup: 0B")
    );
    givenLocalGroups.push(LocalGroup_0B);
    // AND a 3rd level local group with code 01AB
    const LocalGroup_01AB = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "01AB", "LocalGroup: 01AB")
    );
    givenLocalGroups.push(LocalGroup_01AB);
    // AND a 3rd level ISCOGroup with code 0222
    const ISCOGroup_0222 = await repositoryRegistry.OccupationGroup.create(
      // an isco group cannot be created with code 01a2, so we are creating one that is valid, but still should not be allowed to create a hierarchy
      createISCOGroupSpec(givenModelId, "0222", "ISCOGroup: 01A")
    );
    givenISCOGroups.push(ISCOGroup_0222);
    // AND a 3rd level ISCOGroup with code 0111
    const ISCOGroup_0111 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "0111", "ISCOGroup: 0111")
    );
    givenISCOGroups.push(ISCOGroup_0111);
    // AND an esco occupation with a code that does not match the parent code (0200.1) //INVALID
    const ESCOOccupation_0200_1 = await repositoryRegistry.occupation.create(
      createESCOOccupationSpec(givenModelId, "0200.1", ISCOGroup_011.code, "ESCOOccupation: 0200.1")
    );
    givenESCOOccupations.push(ESCOOccupation_0200_1);
    // AND a local occupation with a code that does not match the parent code (0200_1) //INVALID
    const LocalOccupation_0200_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, "0200_1", ISCOGroup_011.code, "LocalOccupation: 0200_1")
    );
    givenLocalOccupations.push(LocalOccupation_0200_1);
    // AND a local occupation with code LocalOccupation: 0111_1
    const LocalOccupation_0111_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, `${ISCOGroup_0111.code}_1`, ISCOGroup_011.code, "LocalOccupation: 0111_1")
    );
    givenLocalOccupations.push(LocalOccupation_0111_1);
    // AND an esco occupation with code 0111.1
    const ESCOOccupation_0111_1 = await repositoryRegistry.occupation.create(
      createESCOOccupationSpec(givenModelId, `${ISCOGroup_0111.code}.1`, ISCOGroup_0111.code, "ESCOOccupation: 0111.1")
    );
    givenESCOOccupations.push(ESCOOccupation_0111_1);
    // AND a 4th level local group with code 0111A
    const LocalGroup_0111A = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "0111A", "LocalGroup: 0111A")
    );
    givenLocalGroups.push(LocalGroup_0111A);
    // AND a local occupation with code 01AB_1
    const LocalOccupation_01AB_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, "01AB_1", LocalGroup_01AB.code, "LocalOccupation: 01AB_1")
    );
    givenLocalOccupations.push(LocalOccupation_01AB_1);
    // AND an esco occupation with code 2222.1
    const ESCOOccupation_2222_1 = await repositoryRegistry.occupation.create(
      // an esco occupation with code 01ab.1 cannot be created, so we create an esco occupation that is valid, but should not be allowed to create a hierarchy
      createESCOOccupationSpec(givenModelId, "2222.1", ISCOGroup_011.code, "ESCOOccupation: 2222.1")
    );
    givenESCOOccupations.push(ESCOOccupation_2222_1);
    // AND a local occupation with a code that does not match the parent code (02XYZ_1) //INVALID
    const LocalOccupation_02XYZ_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, "02XYZ_1", LocalGroup_01AB.code, "LocalOccupation: 02XYZ_1")
    );
    givenLocalOccupations.push(LocalOccupation_02XYZ_1);
    // AND a local occupation with code 0111_1_1
    const LocalOccupation_0111_1_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(
        givenModelId,
        `${LocalOccupation_0111_1.code}_1`,
        ISCOGroup_0111.code,
        "LocalOccupation: 0111_1_1"
      )
    );
    givenLocalOccupations.push(LocalOccupation_0111_1_1);
    // AND an esco occupation with code 0111.1.1
    const ESCOOccupation_0111_1_1 = await repositoryRegistry.occupation.create(
      createESCOOccupationSpec(
        givenModelId,
        `${ESCOOccupation_0111_1.code}.1`,
        ISCOGroup_0111.code,
        "ESCOOccupation: 0111.1_1"
      )
    );
    givenESCOOccupations.push(ESCOOccupation_0111_1_1);
    // AND a local occupation with code 0111.1_1
    const LocalOccupation_0111_DOT_1_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(
        givenModelId,
        `${ESCOOccupation_0111_1.code}_1`,
        ISCOGroup_0111.code,
        "LocalOccupation: 0111.1_1"
      )
    );
    givenLocalOccupations.push(LocalOccupation_0111_DOT_1_1);
    // AND an esco occupation with code 3333.1
    const ESCOOccupation_3333_1 = await repositoryRegistry.occupation.create(
      // an esco occupation with code 01ab_1.1 cannot be created, so we create an esco occupation that is valid, but should not be allowed to create a hierarchy
      createESCOOccupationSpec(givenModelId, "3333.1", ISCOGroup_011.code, "ESCOOccupation: 3333.1")
    );
    givenESCOOccupations.push(ESCOOccupation_3333_1);
    // AND a local group with code DDD
    const LocalGroup_DDD = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "DDD", "LocalGroup: DDD")
    );
    givenLocalGroups.push(LocalGroup_DDD);
    // AND an isco group with code 9999
    const ISCOGroup_9999 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "9999", "ISCOGroup: 9999")
    );
    givenISCOGroups.push(ISCOGroup_9999);
    // AND a local group with code CCC
    const LocalGroup_CCC = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "CCC", "LocalGroup: CCC")
    );
    givenLocalGroups.push(LocalGroup_CCC);
    // AND an isco group with code 8888
    const ISCOGroup_8888 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "8888", "ISCOGroup: 8888")
    );
    givenISCOGroups.push(ISCOGroup_8888);
    // AND an esco occupation with a code that does not match the parent code (0111.1.2.1) //INVALID
    const ESCOOccupation_0111_1_2_1 = await repositoryRegistry.occupation.create(
      createESCOOccupationSpec(
        givenModelId,
        `${ESCOOccupation_0111_1.code}.2.1`,
        ISCOGroup_0111.code,
        "ESCOOccupation: 0111.2.1"
      )
    );
    givenESCOOccupations.push(ESCOOccupation_0111_1_2_1);
    // AND a local occupation with a code that does not match the parent code (0111.1.2_1) //INVALID
    const LocalOccupation_0111_DOT_1_DOT_2_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(
        givenModelId,
        `${ESCOOccupation_0111_1.code}.2_1`,
        ISCOGroup_0111.code,
        "LocalOccupation: 0111.2_1"
      )
    );
    givenLocalOccupations.push(LocalOccupation_0111_DOT_1_DOT_2_1);
    // AND a local occupation with a code that does not match the parent code (0111.1_2_1) //INVALID
    const LocalOccupation_0111_DOT_1_2_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(
        givenModelId,
        `${ESCOOccupation_0111_1.code}_2_1`,
        ISCOGroup_0111.code,
        "LocalOccupation: 0111.2_1"
      )
    );
    givenLocalOccupations.push(LocalOccupation_0111_DOT_1_2_1);

    // AND all the entities are created
    // There should be 8 ISCOGroups in this graph
    expect(givenISCOGroups.length).toBe(8);
    // There should be 7 LocalGroups in this graph
    expect(givenLocalGroups.length).toBe(7);
    // There should be 7 ESCOOccupations in this graph
    expect(givenESCOOccupations.length).toBe(7);
    // There should be 8 LocalOccupations in this graph
    expect(givenLocalOccupations.length).toBe(8);
    // AND the following hierarchy is created
    const givenNewValidHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
      // Green edges (valid)
      //SUCCESS_1: Group (ISCO) -> Group (ISCO)
      {
        parentId: ISCOGroup_0.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ISCOGroup_01.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // SUCCESS_2: Group (ISCO) -> Group (ISCO) -> Group (ISCO)
      {
        parentId: ISCOGroup_01.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ISCOGroup_011.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // SUCCESS_3: Group (ISCO) -> Group (ISCO) -> Group (Local)
      {
        parentId: ISCOGroup_01.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: LocalGroup_01A.id,
        childType: ObjectTypes.LocalGroup,
      },
      // SUCCESS_4: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO)
      {
        parentId: ISCOGroup_011.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ISCOGroup_0111.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // SUCCESS_5: Group (ISCO) -> Group (ISCO) -> Group (Local) -> Group (Local)
      {
        parentId: LocalGroup_01A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalGroup_01AB.id,
        childType: ObjectTypes.LocalGroup,
      },
      // SUCCESS_6: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Occupation (Local)
      {
        parentId: ISCOGroup_0111.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: LocalOccupation_0111_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // SUCCESS_7: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Occupation (ESCO)
      {
        parentId: ISCOGroup_0111.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ESCOOccupation_0111_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // SUCCESS_8: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (Local)
      {
        parentId: ISCOGroup_0111.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: LocalGroup_0111A.id,
        childType: ObjectTypes.LocalGroup,
      },
      // SUCCESS_9: Group (ISCO) -> Group (ISCO) -> Group (Local) -> Group (Local) -> Occupation (Local)
      {
        parentId: LocalGroup_01AB.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalOccupation_01AB_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // SUCCESS_10: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Occupation (Local) -> Occupation (Local)
      {
        parentId: LocalOccupation_0111_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: LocalOccupation_0111_1_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // SUCCESS_11: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Occupation (ESCO) -> Occupation (ESCO)
      {
        parentId: ESCOOccupation_0111_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: ESCOOccupation_0111_1_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // SUCCESS_12: Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Group (ISCO) -> Occupation (ESCO) -> Occupation (Local)
      {
        parentId: ESCOOccupation_0111_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: LocalOccupation_0111_DOT_1_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
    ];
    const givenNewInvalidHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
      // Red edges (invalid)
      // FAIL_1: (CODE) Group (ISCO) ->  Occupation (Local) NON-LEAF-PARENT_GROUP
      // NOTE: This cannot be tested due to the way the code is validated for localoccupations
      // we ensure that occupations cannot be created under the root through their codes, meaning if an esco occupation
      // has a code that starts with an ISCOGroup code that is less than 4 characters, it will not be created
      // in the case of a local occupation however, that constraint cannot exist in the code, (since the parent can be a local group as well)
      // meaning even though this is conceptually not allowed, if we tried to create a local occupation under a root ISCOGroup it would work.
      // {
      //   parentId: ISCOGroup_0.id,
      //   parentType: ObjectTypes.ISCOGroup,
      //   childId: LocalOccupation_0_1.id,
      //   childType: ObjectTypes.LocalOccupation,
      // },
      // FAIL_2: (CODE) Group (ISCO) -> Occupation (ESCO) NON-LEAF-PARENT_GROUP
      {
        parentId: ISCOGroup_0.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ESCOOccupation_0000_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_3: (CODE) Group (ISCO) -> Group (Local)
      {
        parentId: ISCOGroup_01.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: LocalGroup_ABC.id,
        childType: ObjectTypes.LocalGroup,
      },
      // FAIL_4: (CODE) Group (ISCO) -> Group (ISCO)
      {
        parentId: ISCOGroup_01.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ISCOGroup_021.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_5: (CODE) Group (Local) -> Group (Local)
      {
        parentId: LocalGroup_01A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalGroup_0B.id,
        childType: ObjectTypes.LocalGroup,
      },
      // FAIL_6: (TYPE) Group (Local) -> Group (ISCO)
      {
        parentId: LocalGroup_01A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: ISCOGroup_0222.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_7: (CODE) Group (ISCO) -> Occupation (ESCO)
      {
        parentId: ISCOGroup_0111.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: ESCOOccupation_0200_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_8: (CODE) Group (ISCO) -> Occupation (ESCO)
      {
        parentId: ISCOGroup_0111.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: LocalOccupation_0200_1.id,
        childType: LocalOccupation_0200_1.occupationType,
      },
      // FAIL_9: (TYPE) Group (Local) -> Occupation (ESCO)
      {
        parentId: LocalGroup_01AB.id,
        parentType: ObjectTypes.LocalGroup,
        childId: ESCOOccupation_2222_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_10: (CODE) Group (Local) -> Occupation (Local)
      {
        parentId: LocalGroup_01AB.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalOccupation_02XYZ_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // FAIL_11: (TYPE) Occupation (Local) -> Occupation (ESCO)
      {
        parentId: LocalOccupation_01AB_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: ESCOOccupation_3333_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_12: (TYPE) Occupation (ESCO) -> Group (Local)
      {
        parentId: ESCOOccupation_2222_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: LocalGroup_DDD.id,
        childType: ObjectTypes.LocalGroup,
      },
      // FAIL_13: (CODE) Occupation (ESCO) -> Group (ISCO)
      {
        parentId: ESCOOccupation_2222_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: ISCOGroup_9999.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_14: (TYPE) Occupation (Local) -> Group (Local)
      {
        parentId: LocalOccupation_0111_1_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: LocalGroup_CCC.id,
        childType: ObjectTypes.LocalGroup,
      },
      // FAIL_15: (CODE) Occupation (Local) -> Group (ISCO)
      {
        parentId: LocalOccupation_0111_1_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: ISCOGroup_8888.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_16: (CODE) Occupation (ESCO) -> Occupation (ESCO)
      {
        parentId: ESCOOccupation_0111_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: ESCOOccupation_0111_1_2_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_17: (CODE) Occupation (ESCO) -> Occupation (Local)
      {
        parentId: ESCOOccupation_0111_1.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: LocalOccupation_0111_DOT_1_DOT_2_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // FAIL_18: (CODE) Occupation (Local) -> Occupation (Local)
      {
        parentId: LocalOccupation_0111_DOT_1_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: LocalOccupation_0111_DOT_1_2_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
    ];
    const actualNewOccupationHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
      ...givenNewValidHierarchySpecs,
      ...givenNewInvalidHierarchySpecs,
    ]);

    // THEN the valid hierarchy pairs should be created
    expect(actualNewOccupationHierarchy).toHaveLength(givenNewValidHierarchySpecs.length);
    for (const edge of givenNewValidHierarchySpecs) {
      expect(actualNewOccupationHierarchy).toContainEqual(
        expect.objectContaining({
          parentId: edge.parentId,
          parentType: edge.parentType,
          childId: edge.childId,
          childType: edge.childType,
        })
      );
    }
    // AND the invalid ones should not
    // AND there to be a log that says that the invalid entries were not created
    expect(console.warn).toHaveBeenLastCalledWith(
      `OccupationHierarchyRepository.createMany: ${givenNewInvalidHierarchySpecs.length} invalid entries were not created`
    );
  });

  test("should create large hierarchy with varying relationship dynamics with LocalGroup as root node (2nd Graph)", async () => {
    // GIVEN a model
    const givenModelId = getMockStringId(1);
    const givenLocalGroups: IOccupationGroup[] = [];
    const givenISCOGroups: IOccupationGroup[] = [];
    const givenESCOOccupations: IOccupation[] = [];
    const givenLocalOccupations: IOccupation[] = [];

    // AND a root level Local group with code A
    const LocalGroup_A = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "A", "LocalGroup: A")
    );
    givenLocalGroups.push(LocalGroup_A);
    // AND a 1st level Local group with code AA
    const LocalGroup_AA = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "AA", "LocalGroup: AA")
    );
    givenLocalGroups.push(LocalGroup_AA);
    // AND a local occupation with code LocalOccupation: A_1
    const LocalOccupation_A_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, `${LocalGroup_A.code}_1`, LocalGroup_A.code, "LocalOccupation: A_1")
    );
    givenLocalOccupations.push(LocalOccupation_A_1);
    // AND an isco group with code 4444
    const ISCOGroup_4444 = await repositoryRegistry.OccupationGroup.create(
      // an isco group with code A4 cannot be created, so we create an isco group that is valid, but should not be allowed to create a hierarchy
      createISCOGroupSpec(givenModelId, "4444", "ISCOGroup: 4444")
    );
    givenISCOGroups.push(ISCOGroup_4444);
    // AND an isco group with code 5555
    const ISCOGroup_5555 = await repositoryRegistry.OccupationGroup.create(
      // an isco group with code AA5 cannot be created, so we create an isco group that is valid, but should not be allowed to create a hierarchy
      createISCOGroupSpec(givenModelId, "5555", "ISCOGroup: 5555")
    );
    givenISCOGroups.push(ISCOGroup_5555);
    // AND a local occupation with code AA_1
    const LocalOccupation_AA_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, `${LocalGroup_AA.code}_1`, LocalGroup_AA.code, "LocalOccupation: AA_1")
    );
    givenLocalOccupations.push(LocalOccupation_AA_1);
    // AND an isco group with code 6666
    const ISCOGroup_6666 = await repositoryRegistry.OccupationGroup.create(
      // an isco group with code AA_16 cannot be created, so we create an isco group that is valid, but should not be allowed to create a hierarchy
      createISCOGroupSpec(givenModelId, "6666", "ISCOGroup: 6666")
    );
    givenISCOGroups.push(ISCOGroup_6666);
    // AND an esco occupation with code 7777.1
    const ESCOOccupation_7777_1 = await repositoryRegistry.occupation.create(
      // an esco occupation with code AA_1.1 cannot be created, so we create an esco occupation that is valid, but should not be allowed to create a hierarchy
      createESCOOccupationSpec(givenModelId, "7777.1", LocalGroup_AA.code, "ESCOOccupation: 7777.1")
    );
    givenESCOOccupations.push(ESCOOccupation_7777_1);
    // AND a local occupation with code BBB_1
    const LocalOccupation_BBB_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, "BBB_1", LocalGroup_A.code, "LocalOccupation: BBB_1")
    );
    givenLocalOccupations.push(LocalOccupation_BBB_1);
    // AND all the entities are created
    // There should be 3 ISCOGroups in this graph
    expect(givenISCOGroups.length).toBe(3);
    // There should be 2 LocalGroups in this graph
    expect(givenLocalGroups.length).toBe(2);
    // There should be 1 ESCOOccupation in this graph
    expect(givenESCOOccupations.length).toBe(1);
    // There should be 3 LocalOccupations in this graph
    expect(givenLocalOccupations.length).toBe(3);
    // AND the following hierarchy is created
    const givenNewValidHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
      // Green edges (valid)
      // SUCCESS_13: Group (Local) -> Group (Local)
      {
        parentId: LocalGroup_A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalGroup_AA.id,
        childType: ObjectTypes.LocalGroup,
      },
      // SUCCESS_14: Group (Local) -> Occupation (Local)
      {
        parentId: LocalGroup_A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalOccupation_A_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // SUCCESS_15: Group (Local) -> Group (Local) -> Occupation (Local)
      {
        parentId: LocalGroup_AA.id,
        parentType: ObjectTypes.LocalGroup,
        childId: LocalOccupation_AA_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
    ];
    const givenNewInvalidHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
      // Red edges (invalid)
      // FAIL_19: (TYPE) Group (Local) -> Group (ISCO)
      {
        parentId: LocalGroup_A.id,
        parentType: ObjectTypes.LocalGroup,
        childId: ISCOGroup_4444.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_20: (TYPE) Group (Local) -> Group (ISCO)
      {
        parentId: LocalGroup_AA.id,
        parentType: ObjectTypes.LocalGroup,
        childId: ISCOGroup_5555.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_21: (TYPE) Group (Local) -> Group (Local) -> Occupation (Local) -> Group (ISCO)
      {
        parentId: LocalOccupation_AA_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: ISCOGroup_6666.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_22: (TYPE) Group (Local) -> Group (Local) -> Occupation (Local) -> Occupation (ESCO)
      {
        parentId: LocalOccupation_AA_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: ESCOOccupation_7777_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
      // FAIL_23: (TYPE) Group (Local) -> Group (Local) -> Occupation (Local) -> Occupation (Local)
      {
        parentId: LocalOccupation_AA_1.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: LocalOccupation_BBB_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
    ];
    const actualNewOccupationHierarchy = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, [
      ...givenNewValidHierarchySpecs,
      ...givenNewInvalidHierarchySpecs,
    ]);

    // THEN the valid hierarchy pairs should be created
    expect(actualNewOccupationHierarchy).toHaveLength(givenNewValidHierarchySpecs.length);
    for (const edge of givenNewValidHierarchySpecs) {
      expect(actualNewOccupationHierarchy).toContainEqual(
        expect.objectContaining({
          parentId: edge.parentId,
          parentType: edge.parentType,
          childId: edge.childId,
          childType: edge.childType,
        })
      );
    }
    // AND the invalid ones should not
    // AND there to be a log that says that the invalid entries were not created
    expect(console.warn).toHaveBeenLastCalledWith(
      `OccupationHierarchyRepository.createMany: ${givenNewInvalidHierarchySpecs.length} invalid entries were not created`
    );
  });

  test("should not construct a hierarchy when the root node is non-existent (Graph-3)", async () => {
    // GIVEN a model
    const givenModelId = getMockStringId(1);
    const givenLocalGroups: IOccupationGroup[] = [];
    const givenISCOGroups: IOccupationGroup[] = [];
    const givenESCOOccupations: IOccupation[] = [];
    const givenLocalOccupations: IOccupation[] = [];

    // AND an isco group with code 8
    const ISCOGroup_8 = await repositoryRegistry.OccupationGroup.create(
      createISCOGroupSpec(givenModelId, "8", "ISCOGroup: 8")
    );
    givenISCOGroups.push(ISCOGroup_8);
    // AND a Local group with code C
    const LocalGroup_C = await repositoryRegistry.OccupationGroup.create(
      createLocalGroupSpec(givenModelId, "C", "LocalGroup: C")
    );
    givenLocalGroups.push(LocalGroup_C);
    // AND a local occupation with code 9_1
    const LocalOccupation_D_1 = await repositoryRegistry.occupation.create(
      createLocalOccupationSpec(givenModelId, "D_1", LocalGroup_C.code, "LocalOccupation: D_1")
    );
    givenLocalOccupations.push(LocalOccupation_D_1);
    // AND an esco occupation with code 9.1
    const ESCOOccupation_9999_1 = await repositoryRegistry.occupation.create(
      createESCOOccupationSpec(givenModelId, "9999.1", LocalGroup_C.code, "ESCOOccupation: 9999.1")
    );
    givenESCOOccupations.push(ESCOOccupation_9999_1);

    // AND all the entities are created
    // There should be 1 ISCOGroup in this graph
    expect(givenISCOGroups.length).toBe(1);
    // There should be 1 LocalGroup in this graph
    expect(givenLocalGroups.length).toBe(1);
    // There should be 1 ESCOOccupation in this graph
    expect(givenESCOOccupations.length).toBe(1);
    // There should be 1 LocalOccupation in this graph
    expect(givenLocalOccupations.length).toBe(1);
    // AND the following hierarchy is created

    const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [
      // Red edges (invalid)
      // FAIL_24: (NONEXISTENT) NA -> Group (ISCO)
      {
        parentId: "foo",
        parentType: ObjectTypes.ISCOGroup,
        childId: ISCOGroup_8.id,
        childType: ObjectTypes.ISCOGroup,
      },
      // FAIL_25: (NONEXISTENT) NA -> Group (Local)
      {
        parentId: "foo",
        parentType: ObjectTypes.LocalGroup,
        childId: LocalGroup_C.id,
        childType: ObjectTypes.LocalGroup,
      },
      // FAIL_26: (NONEXISTENT) NA -> Occupation (Local)
      {
        parentId: "foo",
        parentType: ObjectTypes.LocalGroup,
        childId: LocalOccupation_D_1.id,
        childType: ObjectTypes.LocalOccupation,
      },
      // FAIL_27: (NONEXISTENT) NA -> Occupation (ESCO)
      {
        parentId: "foo",
        parentType: ObjectTypes.LocalGroup,
        childId: ESCOOccupation_9999_1.id,
        childType: ObjectTypes.ESCOOccupation,
      },
    ];
    const actualNewOccupationHierarchy = await repositoryRegistry.occupationHierarchy.createMany(
      givenModelId,
      givenNewHierarchySpecs
    );

    // THEN no entries should be created
    expect(actualNewOccupationHierarchy).toHaveLength(0);
    // AND the invalid ones should not
    // AND there to be a log that says that the invalid entries were not created
    expect(console.warn).toHaveBeenLastCalledWith(
      `OccupationHierarchyRepository.createMany: ${givenNewHierarchySpecs.length} invalid entries were not created`
    );
  });
});
