// suppress chatty log output when testing
import "_test_utilities/consoleMock";

import "jest-performance-matchers";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { Connection } from "mongoose";
import { getNewConnection } from "server/connection/newConnection";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import {
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewLocalOccupationSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
} from "esco/occupationHierarchy/occupationHierarchy.types";
import { IISCOGroup } from "esco/iscoGroup/ISCOGroup.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { ISkill } from "esco/skill/skills.types";
import { IOccupation } from "esco/occupations/occupation.types";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  SkillToSkillRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import {
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

describe("Test the Performance of Repositories with an in-memory mongodb", () => {
  let dbConnection: Connection;
  let repositoryRegistry: RepositoryRegistry;
  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("PerformanceTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    repositoryRegistry = new RepositoryRegistry();
    await repositoryRegistry.initialize(dbConnection);
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
    if (dbConnection) {
      for (const collection of Object.values(dbConnection.collections)) {
        await collection.deleteMany({});
      }
    }
  }

  describe("Test ISCOGroup", () => {
    test("should successfully create many ISCO groups with acceptable performance", async () => {
      // WHEN N ISCOGroups are created
      const N = 1000;
      const actualNewISCOGroups: IISCOGroup[] = [];
      const createISCOGroupsInDBPromise = async () => {
        const docs = await repositoryRegistry.ISCOGroup.createMany(
          Array.from({ length: N }, (_, index) => getSimpleNewISCOGroupSpec(getMockStringId(1), `group_${index}`))
        );
        actualNewISCOGroups.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.ISCOGroup.Model.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createISCOGroupsInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the groups to be created without timing out
      expect(actualNewISCOGroups).toHaveLength(N * ITERATIONS);
    });
  });

  describe("Test Occupation", () => {
    test("should successfully createMany() ESCO & Local Occupations with acceptable performance", async () => {
      // WHEN N ESCO and Local occupations are created
      const N = 500;
      const actualNewOccupations: IOccupation[] = [];
      const newOccupationSpecs = Array.from({ length: N }, (_, index) =>
        getSimpleNewESCOOccupationSpec(getMockStringId(1), `esco_${index}`)
      );
      newOccupationSpecs.push(
        ...Array.from({ length: N }, (_, index) =>
          getSimpleNewLocalOccupationSpec(getMockStringId(1), `local_${index}`)
        )
      );
      const createOccupationInDBPromise = async () => {
        const docs = await repositoryRegistry.occupation.createMany(newOccupationSpecs);
        actualNewOccupations.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.occupation.Model.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createOccupationInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the groups to be created without timing out
      expect(actualNewOccupations).toHaveLength(2 * N * ITERATIONS);
    });
  });

  describe("Test SkillGroup", () => {
    test("should successfully createMany() SkillGroup with acceptable performance", async () => {
      // WHEN N SkillGroup are created
      const N = 1000;
      const actualNewSkillGroup: ISkillGroup[] = [];
      const createSkillGroupInDBPromise = async () => {
        const docs = await repositoryRegistry.skillGroup.createMany(
          Array.from({ length: N }, (_, index) => getSimpleNewSkillGroupSpec(getMockStringId(1), `group_${index}`))
        );
        actualNewSkillGroup.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.skillGroup.Model.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createSkillGroupInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the groups to be created without timing out
      expect(actualNewSkillGroup).toHaveLength(N * ITERATIONS);
    });
  });

  describe("Test Skill", () => {
    test("should successfully createMany() Skills with acceptable performance", async () => {
      // WHEN N Skill are created
      const N = 1000;
      const actualNewSkills: ISkill[] = [];
      const createSkillInDBPromise = async () => {
        const docs = await repositoryRegistry.skill.createMany(
          Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(getMockStringId(1), `skill_${index}`))
        );
        actualNewSkills.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.skill.Model.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createSkillInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the groups to be created without timing out
      expect(actualNewSkills).toHaveLength(N * ITERATIONS);
    });
  });

  describe("Test occupationHierarchy", () => {
    test("should successfully createMany() Occupation hierarchies with acceptable performance", async () => {
      // GIVEN N ISCOGroups exist in the database
      const N = 1000;
      const givenModelId = getMockStringId(1);
      const givenISCOGroups = await repositoryRegistry.ISCOGroup.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewISCOGroupSpec(givenModelId, `group_${index}`))
      );
      // AND N ESCO Occupations exist in the database
      const givenOccupations = await repositoryRegistry.occupation.createMany(
        Array.from({ length: N }, (_, index) =>
          getSimpleNewESCOOccupationSpec(givenModelId, `esco_occupation_${index}`)
        )
      );
      // AND N LOCAL Occupations exist in the database
      const givenLocalOccupations = await repositoryRegistry.occupation.createMany(
        Array.from({ length: N }, (_, index) =>
          getSimpleNewLocalOccupationSpec(givenModelId, `local_occupation_${index}`)
        )
      );
      // AND the ISCOGroups <- ESCO Occupation <- Local Occupation  hierarchy specs
      const givenNewHierarchySpecs: INewOccupationHierarchyPairSpec[] = [];
      for (let i = 0; i < N; i++) {
        const iscoGroup = givenISCOGroups[i];
        const occupation = givenOccupations[i];
        const localOccupation = givenLocalOccupations[i];
        givenNewHierarchySpecs.push(
          {
            parentId: iscoGroup.id,
            parentType: ObjectTypes.ISCOGroup,
            childId: occupation.id,
            childType: occupation.occupationType,
          },
          {
            parentId: occupation.id,
            parentType: occupation.occupationType,
            childId: localOccupation.id,
            childType: localOccupation.occupationType,
          }
        );
      }

      // WHEN the hierarchy are created
      const actualHierarchy: IOccupationHierarchyPair[] = [];
      const createHierarchyInDBPromise = async () => {
        const docs = await repositoryRegistry.occupationHierarchy.createMany(givenModelId, givenNewHierarchySpecs);
        actualHierarchy.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.occupationHierarchy.hierarchyModel.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createHierarchyInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the hierarchy to be created without timing out
      expect(actualHierarchy).toHaveLength(2 * N * ITERATIONS);
    });
  });

  describe("Test skillHierarchy", () => {
    test("should successfully createMany() with acceptable performance", async () => {
      // GIVEN N SkillGroups exist in the database
      const N = 1000;
      const givenModelId = getMockStringId(1);
      const givenSkillGroups_1 = await repositoryRegistry.skillGroup.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillGroupSpec(givenModelId, `group_1_${index}`))
      );
      // AND another N SKillGroups exist in the database
      const givenSkillGroups_2 = await repositoryRegistry.skillGroup.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillGroupSpec(givenModelId, `group_2_${index}`))
      );
      // AND N Skills exist in the database
      const givenSkills = await repositoryRegistry.skill.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(givenModelId, `skill_${index}`))
      );
      // AND the SkillGroup 1 <- Skill Group 2 <- Skill hierarchy specs
      const givenNewHierarchySpecs: INewSkillHierarchyPairSpec[] = [];
      for (let i = 0; i < N; i++) {
        const group_1 = givenSkillGroups_1[i];
        const group_2 = givenSkillGroups_2[i];
        const skill = givenSkills[i];
        givenNewHierarchySpecs.push(
          {
            parentId: group_1.id,
            parentType: ObjectTypes.SkillGroup,
            childId: group_2.id,
            childType: ObjectTypes.SkillGroup,
          },
          {
            parentId: group_2.id,
            parentType: ObjectTypes.SkillGroup,
            childId: skill.id,
            childType: ObjectTypes.Skill,
          }
        );
      }

      // WHEN the hierarchy are created
      const actualHierarchy: ISkillHierarchyPair[] = [];
      const createHierarchyInDBPromise = async () => {
        const docs = await repositoryRegistry.skillHierarchy.createMany(givenModelId, givenNewHierarchySpecs);
        actualHierarchy.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.skillHierarchy.hierarchyModel.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createHierarchyInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the hierarchy to be created without timing out
      expect(actualHierarchy).toHaveLength(2 * N * ITERATIONS);
    });
  });

  describe("Test occupationToSkillRelation", () => {
    test("should successfully createMany() with acceptable performance", async () => {
      // GIVEN N Occupations exist in the database
      const N = 1000;
      const givenModelId = getMockStringId(1);
      const givenESCOOccupations = await repositoryRegistry.occupation.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewESCOOccupationSpec(givenModelId, `esco_occ_1_${index}`))
      );
      // AND another N Local Occupations exist in the database
      const givenLocalOccupations = await repositoryRegistry.occupation.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewLocalOccupationSpec(givenModelId, `local_occ_1_${index}`))
      );

      // AND N Skills exist in the database
      const givenSkills = await repositoryRegistry.skill.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(givenModelId, `skill_${index}`))
      );
      // AND the Occupation <- skill and LocalizedOccupation <- skill for the Occupation to Skill Relation specs
      const givenNewRelationSpecs: INewOccupationToSkillPairSpec[] = [];
      for (let i = 0; i < N; i++) {
        const esco_occupation = givenESCOOccupations[i];
        const local_occupation = givenLocalOccupations[i];
        const skill = givenSkills[i];
        givenNewRelationSpecs.push(
          {
            requiringOccupationId: esco_occupation.id,
            requiringOccupationType: esco_occupation.occupationType,
            requiredSkillId: skill.id,
            relationType: OccupationToSkillRelationType.ESSENTIAL,
            signallingValueLabel: SignallingValueLabel.NONE,
            signallingValue: null,
          },
          {
            requiringOccupationId: local_occupation.id,
            requiringOccupationType: local_occupation.occupationType,
            requiredSkillId: skill.id,
            relationType: OccupationToSkillRelationType.NONE,
            signallingValueLabel: SignallingValueLabel.HIGH,
            signallingValue: 0,
          }
        );
      }

      // WHEN the relations are created
      const actualRelation: IOccupationToSkillRelationPair[] = [];
      const createRelationInDBPromise = async () => {
        const docs = await repositoryRegistry.occupationToSkillRelation.createMany(givenModelId, givenNewRelationSpecs);
        actualRelation.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.occupationToSkillRelation.relationModel.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createRelationInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the relations to be created without timing out
      expect(actualRelation).toHaveLength(2 * N * ITERATIONS);
    });
  });

  describe("Test skillToSkillRelation", () => {
    test("should successfully createMany() with acceptable performance", async () => {
      // GIVEN N Skills exist in the database
      const N = 1000;
      const givenModelId = getMockStringId(1);
      const givenSkills_1 = await repositoryRegistry.skill.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(givenModelId, `skill_1_${index}`))
      );
      // AND another N SKills exist in the database
      const givenSkills_2 = await repositoryRegistry.skill.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(givenModelId, `skill_2_${index}`))
      );
      // AND even another N Skills exist in the database
      const givenSkills_3 = await repositoryRegistry.skill.createMany(
        Array.from({ length: N }, (_, index) => getSimpleNewSkillSpec(givenModelId, `skill_3_${index}`))
      );
      // AND the Skill 1 <- Skill 2 <- Skill 3 to Skill Relation specs
      const givenNewRelationSpecs: INewSkillToSkillPairSpec[] = [];
      for (let i = 0; i < N; i++) {
        const skill_1 = givenSkills_1[i];
        const skill_2 = givenSkills_2[i];
        const skill_3 = givenSkills_3[i];
        givenNewRelationSpecs.push(
          {
            requiredSkillId: skill_1.id,
            requiringSkillId: skill_2.id,
            relationType: SkillToSkillRelationType.ESSENTIAL,
          },
          {
            requiredSkillId: skill_2.id,
            requiringSkillId: skill_3.id,
            relationType: SkillToSkillRelationType.OPTIONAL,
          }
        );
      }

      // WHEN the relations are created
      const actualRelation: ISkillToSkillRelationPair[] = [];
      const createRelationInDBPromise = async () => {
        const docs = await repositoryRegistry.skillToSkillRelation.createMany(givenModelId, givenNewRelationSpecs);
        actualRelation.push(...docs);
        // delete all the created entries to avoid unique index violations
        await repositoryRegistry.skillToSkillRelation.relationModel.deleteMany({}).exec();
      };
      const ITERATIONS = 3;
      await expect(createRelationInDBPromise).toResolveWithinQuantile(1500, { iterations: ITERATIONS, quantile: 95 });
      // THEN expect the relations to be created without timing out
      expect(actualRelation).toHaveLength(2 * N * ITERATIONS);
    });
  });
});
