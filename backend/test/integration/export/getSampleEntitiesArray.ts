import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation.types";
import { getMockRandomOccupationGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import {
  INewOccupationGroupSpec,
  IOccupationGroup,
  OccupationGroupType,
} from "esco/occupationGroup/OccupationGroup.types";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { INewOccupationHierarchyPairSpec } from "esco/occupationHierarchy/occupationHierarchy.types";
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

export const getSampleESCOOccupationSpecs = (givenModelId: string): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length: 100 }, (_, i) => ({
    OccupationGroupCode: getMockRandomOccupationGroupCode(),
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

export const getSampleLocalOccupationSpecs = (givenModelId: string): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length: 100 }, (_, i) => ({
    OccupationGroupCode: getMockRandomOccupationGroupCode(),
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

export const getSampleOccupationGroupSpecs = (givenModelId: string): INewOccupationGroupSpec[] => {
  return Array.from<never, INewOccupationGroupSpec>({ length: 100 }, (_, i) => ({
    code: getMockRandomOccupationGroupCode(),
    preferredLabel: `OccupationGroup_${i}`,
    modelId: givenModelId,
    groupType: OccupationGroupType.ISCO_GROUP,
    UUIDHistory: [randomUUID()],
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    originUri: `originUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
  }));
};

export const getSampleSkillsSpecs = (givenModelId: string): INewSkillSpec[] => {
  return Array.from<never, INewSkillSpec>({ length: 100 }, (_, i) => ({
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
  }));
};

export const getSampleSkillGroupsSpecs = (givenModelId: string): INewSkillGroupSpec[] => {
  return Array.from<never, INewSkillGroupSpec>({ length: 100 }, (_, i) => ({
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

export const getSampleOccupationHierarchy = (
  occupation_groups: IOccupationGroup[],
  esco_occupations: IOccupation[],
  local_occupations: IOccupation[]
): INewOccupationHierarchyPairSpec[] => {
  const specs: INewOccupationHierarchyPairSpec[] = [];
  let index = 0;
  occupation_groups.forEach((occupationGroup) => {
    // add 1 occupation to each occupation group
    if (index < esco_occupations.length) {
      specs.push({
        parentId: occupationGroup.id,
        parentType: ObjectTypes.OccupationGroup,
        childType: esco_occupations[index].occupationType,
        childId: esco_occupations[index].id,
      });
    }
    index++;
  });

  index = 0;
  esco_occupations.forEach((escoOccupation) => {
    // add 1 occupation to each esco occupation
    if (index < local_occupations.length) {
      specs.push({
        parentId: escoOccupation.id,
        parentType: escoOccupation.occupationType,
        childType: local_occupations[index].occupationType,
        childId: local_occupations[index].id,
      });
    }
    index++;
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
