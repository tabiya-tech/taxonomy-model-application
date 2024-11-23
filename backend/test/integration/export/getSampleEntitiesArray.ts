import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation.types";
import { getMockRandomISCOGroupCode, getMockRandomLocalGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import {
  INewOccupationGroupSpec,
  IOccupationGroup,
} from "esco/occupationGroup/OccupationGroup.types";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { INewOccupationHierarchyPairSpec} from "esco/occupationHierarchy/occupationHierarchy.types";
import { INewSkillHierarchyPairSpec } from "esco/skillHierarchy/skillHierarchy.types";
import {
  INewOccupationToSkillPairSpec,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import {
  INewSkillToSkillPairSpec,
  SkillToSkillRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { randomUUID } from "crypto";

export const getSampleESCOOccupationSpecs = (givenModelId: string, length: number = 10): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length }, (_, i) => ({
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: `definition_${i}`,
    regulatedProfessionNote: `regulatedProfessionNote_${i}`,
    scopeNote: `scopeNote_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    code: getMockRandomOccupationCode(false),
    preferredLabel: `Occupation_${i}`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
    isLocalized: i % 2 === 0,
    occupationType: ObjectTypes.ESCOOccupation,
  }));
};

export const getSampleLocalOccupationSpecs = (givenModelId: string, length: number = 10): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length }, (_, i) => ({
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: `definition_${i}`,
    regulatedProfessionNote: `regulatedProfessionNote_${i}`,
    scopeNote: `scopeNote_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    code: getMockRandomOccupationCode(true),
    preferredLabel: `Occupation_${i}`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
    isLocalized: false,
    occupationType: ObjectTypes.LocalOccupation,
  }));
};

export const getSampleISCOGroupSpecs = (givenModelId: string, length: number = 10): INewOccupationGroupSpec[] => {
  return Array.from<never, INewOccupationGroupSpec>({ length }, (_, i) => ({
    code: getMockRandomISCOGroupCode(),
    preferredLabel: `OccupationGroup_${i}`,
    modelId: givenModelId,
    groupType: ObjectTypes.ISCOGroup,
    UUIDHistory: [randomUUID()],
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
  }));
};

export const getSampleLocalGroupSpecs = (givenModelId: string, length: number = 10): INewOccupationGroupSpec[] => {
  return Array.from<never, INewOccupationGroupSpec>({ length }, (_, i) => ({
    code: getMockRandomLocalGroupCode(),
    preferredLabel: `OccupationGroup_${i}`,
    modelId: givenModelId,
    groupType: ObjectTypes.LocalGroup,
    UUIDHistory: [randomUUID()],
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
  }));
};

export const getSampleSkillsSpecs = (givenModelId: string, length: number = 10): INewSkillSpec[] => {
  return Array.from<never, INewSkillSpec>({ length }, (_, i) => ({
    preferredLabel: `Skill_${i}`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    originUri: `originUri_${i}`,
    definition: `definition_${i}`,
    description: `description_${i}`,
    scopeNote: `scopeNote_${i}`,
    skillType: SkillType.Knowledge,
    reuseLevel: ReuseLevel.CrossSector,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    importId: `importId_${i}`,
    isLocalized: i % 2 === 0,
  }));
};

export const getSampleSkillGroupsSpecs = (givenModelId: string, length: number = 10): INewSkillGroupSpec[] => {
  return Array.from<never, INewSkillGroupSpec>({ length }, (_, i) => ({
    code: getMockRandomSkillCode(),
    preferredLabel: `SkillGroup_${i}`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    scopeNote: `scopeNote_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    importId: `importId_${i}`,
  }));
};

export const getSampleISCOGroupSpecsWithParent = (givenModelId: string, parent: INewOccupationGroupSpec): INewOccupationGroupSpec => {
  // Create ISCO groups with properly structured codes
  return {
    code: `${parent.code}1`,
    preferredLabel: `ISCOGroup_1`,
    modelId: givenModelId,
    groupType: ObjectTypes.ISCOGroup,
    UUIDHistory: [randomUUID()],
    altLabels: [`altLabel_1`, `altLabel_2`],
    originUri: `originUri_1`,
    description: `description_1`,
    importId: `importId_1`,
  };
};
const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let _alphabetIndex = 0;
export const getSampleLocalGroupSpecsWithParent = (givenModelId: string, parent: INewOccupationGroupSpec): INewOccupationGroupSpec => {
  // Create local groups with codes based on their parent ISCO groups
  const code = parent.code + characters[_alphabetIndex++];
  return {
    code: code, // e.g., ISCO1L, ISCO1B
    preferredLabel: `LocalGroup_1`,
    modelId: givenModelId,
    groupType: ObjectTypes.LocalGroup,
    UUIDHistory: [randomUUID()],
    altLabels: [`altLabel_1`, `altLabel_2`],
    originUri: `originUri_1`,
    description: `description_1`,
    importId: `importId_1`,
  };
};

export const getSampleESCOOccupationSpecsWithParent = (givenModelId: string, parent: INewOccupationGroupSpec | INewOccupationSpec): INewOccupationSpec => {
  // Create ESCO occupations with codes based on their parent groups
  return {
    occupationGroupCode: parent.code.split(".")[0],
    code: `${parent.code}.1`, // e.g., 1000.1, 1000.2
    preferredLabel: `ESCOOccupation_1`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    definition: `definition_1`,
    regulatedProfessionNote: `regulatedProfessionNote_1`,
    scopeNote: `scopeNote_1`,
    altLabels: [`altLabel_1`, `altLabel_2`],
    originUri: `originUri_1`,
    description: `description_1`,
    importId: `importId_1`,
    isLocalized: false,
    occupationType: ObjectTypes.ESCOOccupation,
  };
};

export const getSampleLocalOccupationSpecsWithParent = (givenModelId: string, parent: INewOccupationSpec | INewOccupationGroupSpec): INewOccupationSpec => {
  return {
    occupationGroupCode: parent.code.split("_")[0].split(".")[0],
    code: `${parent.code}_1`,
    preferredLabel: `LocalOccupation_1`,
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    definition: `definition_1`,
    regulatedProfessionNote: `regulatedProfessionNote_1`,
    scopeNote: `scopeNote_1`,
    altLabels: [`altLabel_1`, `altLabel_2`],
    originUri: `originUri_1`,
    description: `description_1`,
    importId: `importId_1`,
    isLocalized: false,
    occupationType: ObjectTypes.LocalOccupation,
  };
};

export const generateSampleEntitySpecs = (
  givenModelId: string
): {
  local_occupations_with_parent_isco_groups: INewOccupationSpec[];
  local_occupations_with_parent_local_groups: INewOccupationSpec[];
  local_occupations_with_parent_esco_occupations: INewOccupationSpec[];
  local_occupations_with_parent_local_occupations: INewOccupationSpec[];
  local_groups_with_parent_isco_groups: INewOccupationGroupSpec[];
  esco_occupations_with_parent_isco_groups: INewOccupationSpec[];
  esco_occupations_with_parent_esco_occupations: INewOccupationSpec[];
  isco_groups_with_parent_l1: INewOccupationGroupSpec[];
  isco_groups_with_parent_l2: INewOccupationGroupSpec[];
  isco_groups_with_parent_l3: INewOccupationGroupSpec[];
  base_isco_groups: INewOccupationGroupSpec[];
} => {

  // create 10 base ISCO groups (Level 0)
  const base_isco_groups = getSampleISCOGroupSpecs(givenModelId, 10);

  // create 10 ISCO groups with parent (Level 1)
  const isco_groups_with_parent_l1 = base_isco_groups.map((group) => {
    return getSampleISCOGroupSpecsWithParent(givenModelId, group);
  });
  
  // create 10 ISCO groups with parents (Level 2)
  const isco_groups_with_parent_l2 = isco_groups_with_parent_l1.map((group) => {
    return getSampleISCOGroupSpecsWithParent(givenModelId, group);
  });

  // create 10 ISCO groups with parents (Level 3)
  const isco_groups_with_parent_l3 = isco_groups_with_parent_l2.map((group) => {
    return getSampleISCOGroupSpecsWithParent(givenModelId, group);
  });

  // create 10 local groups with parent ISCO groups
  const local_groups_with_parent_isco_groups = isco_groups_with_parent_l3.map((group) => {
    return getSampleLocalGroupSpecsWithParent(givenModelId, group);
  });

  // create 10 ESCO occupations with parent ISCO groups
  const esco_occupations_with_parent_isco_groups = isco_groups_with_parent_l3.map((group) => {
    return getSampleESCOOccupationSpecsWithParent(givenModelId, group);
  });

  // create 10 ESCO occupations with parent ESCO occupations
  const esco_occupations_with_parent_esco_occupations = esco_occupations_with_parent_isco_groups.map((occupation) => {
    return getSampleESCOOccupationSpecsWithParent(givenModelId, occupation);
  });

  // create 10 local occupations with parent ISCO groups
  const local_occupations_with_parent_isco_groups = isco_groups_with_parent_l3.map((group) => {
    return getSampleLocalOccupationSpecsWithParent(givenModelId, group);
  });

  // create 10 local occupations with parent local groups
  const local_occupations_with_parent_local_groups = local_groups_with_parent_isco_groups.map((group) => {
    return getSampleLocalOccupationSpecsWithParent(givenModelId, group);
  });

  // create 10 local occupations with parent ESCO occupations
  const local_occupations_with_parent_esco_occupations = esco_occupations_with_parent_isco_groups.map((occupation) => {
    return getSampleLocalOccupationSpecsWithParent(givenModelId, occupation);
  });

  // create 10 local occupations with parent local occupations
  const local_occupations_with_parent_local_occupations = local_occupations_with_parent_local_groups.map((occupation) => {
    return getSampleLocalOccupationSpecsWithParent(givenModelId, occupation);
  });
  
  return {
    local_occupations_with_parent_isco_groups,
    local_occupations_with_parent_local_groups,
    local_occupations_with_parent_esco_occupations,
    local_occupations_with_parent_local_occupations,
    local_groups_with_parent_isco_groups,
    esco_occupations_with_parent_isco_groups,
    esco_occupations_with_parent_esco_occupations,
    isco_groups_with_parent_l1,
    isco_groups_with_parent_l2,
    isco_groups_with_parent_l3,
    base_isco_groups,
  };
};

export const getSampleOccupationHierarchySpecs = (
  givenBaseISCOGroups: IOccupationGroup[],
  givenISCOGroupsL1: IOccupationGroup[],
  givenISCOGroupsL2: IOccupationGroup[],
  givenISCOGroupsL3: IOccupationGroup[],
  givenESCOOccupationsWithParentISCOGroups: IOccupation[],
  givenESCOOccupationsWithParentESCOOccupations: IOccupation[],
  givenLocalOccupationsWithParentISCOGroups: IOccupation[],
  givenLocalOccupationsWithParentLocalGroups: IOccupation[],
  givenLocalOccupationsWithParentESCOOccupations: IOccupation[],
  givenLocalOccupationsWithParentLocalOccupations: IOccupation[],
  givenLocalGroupsWithParentISCOGroups: IOccupationGroup[],
): INewOccupationHierarchyPairSpec[] => {
  const specs: INewOccupationHierarchyPairSpec[] = [];

  // ISCO groups -> ISCO groups
  givenBaseISCOGroups.forEach((parent, index) => {
    const child = givenISCOGroupsL1[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: child.id,
        childType: ObjectTypes.ISCOGroup,
      });
    }
  });

  // ISCO groups -> Local groups
  givenISCOGroupsL3.forEach((parent, index) => {
    const child = givenLocalGroupsWithParentISCOGroups[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: child.id,
        childType: ObjectTypes.LocalGroup,
      });
    }
  });

  // ISCO groups -> ESCO occupations
  givenISCOGroupsL3.forEach((parent, index) => {
    const child = givenESCOOccupationsWithParentISCOGroups[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: child.id,
        childType: ObjectTypes.ESCOOccupation,
      });
    }
  });

  // ISCO Groups -> Local occupations
  givenISCOGroupsL3.forEach((parent, index) => {
    const child = givenLocalOccupationsWithParentISCOGroups[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: child.id,
        childType: ObjectTypes.LocalOccupation,
      });
    }
  });

  // ESCO occupations -> ESCO occupations
  givenESCOOccupationsWithParentISCOGroups.forEach((parent, index) => {
    const child = givenESCOOccupationsWithParentESCOOccupations[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: child.id,
        childType: ObjectTypes.ESCOOccupation,
      });
    }
  });

  // ESCO occupations -> Local occupations
  givenESCOOccupationsWithParentISCOGroups.forEach((parent, index) => {
    const child = givenLocalOccupationsWithParentESCOOccupations[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.ESCOOccupation,
        childId: child.id,
        childType: ObjectTypes.LocalOccupation,
      });
    }
  });

  // Local occupations -> Local occupations
  givenLocalOccupationsWithParentLocalGroups.forEach((parent, index) => {
    const child = givenLocalOccupationsWithParentLocalOccupations[index];
    if(child) {
      specs.push({
        parentId: parent.id,
        parentType: ObjectTypes.LocalOccupation,
        childId: child.id,
        childType: ObjectTypes.LocalOccupation,
      });
    }
  });

  return specs;
};

export const getSampleSkillsHierarchy = (
  givenSkills: ISkill[],
  givenSkillGroups: ISkillGroup[]
): INewSkillHierarchyPairSpec[] => {
  return givenSkills.map((skill) => ({
    parentId: givenSkillGroups[0].id,
    parentType: ObjectTypes.SkillGroup,
    childType: ObjectTypes.Skill,
    childId: skill.id,
  }));
};

export const getSampleOccupationToSkillRelations = (
  givenOccupations: IOccupation[],
  givenSkills: ISkill[]
): INewOccupationToSkillPairSpec[] => {
  expect(givenOccupations.length).toBeGreaterThanOrEqual(givenSkills.length);
  function getRelationType(i: number, occupationType: string) {
    if(occupationType === ObjectTypes.ESCOOccupation) {
      switch (i % 2) {
        case 0:
          return OccupationToSkillRelationType.OPTIONAL;
        case 1:
          return OccupationToSkillRelationType.ESSENTIAL;
        default:
          return OccupationToSkillRelationType.OPTIONAL;
      }
    } else return OccupationToSkillRelationType.NONE;
  }

  function getSignallingValueLabel(i: number, occupationType: string) {
    if(occupationType === ObjectTypes.LocalOccupation) {
      switch (i % 3) {
        case 0:
          return SignallingValueLabel.LOW;
        case 1:
          return SignallingValueLabel.MEDIUM;
        case 2:
          return SignallingValueLabel.HIGH;
        default:
          return SignallingValueLabel.LOW;
      }
    } else return SignallingValueLabel.NONE;
  }
  return givenSkills.map((skill, i) => ({
        requiringOccupationType: givenOccupations[i].occupationType,
        requiredSkillId: skill.id,
        requiringOccupationId: givenOccupations[i].id,
        relationType: getRelationType(i, givenOccupations[i].occupationType),
        signallingValueLabel: getSignallingValueLabel(i, givenOccupations[i].occupationType),
        signallingValue: givenOccupations[i].occupationType === ObjectTypes.LocalOccupation ? Math.random() : null,
    })
  );
};

export const getSampleSkillToSkillRelations = (givenSkills: ISkill[]): INewSkillToSkillPairSpec[] => {
  return givenSkills.map((skill, i) => ({
    requiringSkillId: givenSkills[i + 1]?.id ?? givenSkills[0].id,
    requiredSkillId: skill.id,
    relationType: SkillToSkillRelationType.OPTIONAL,
  }));
};
