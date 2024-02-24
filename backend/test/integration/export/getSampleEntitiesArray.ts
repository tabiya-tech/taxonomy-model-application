import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { INewOccupationHierarchyPairSpec } from "esco/occupationHierarchy/occupationHierarchy.types";
import { INewSkillHierarchyPairSpec } from "esco/skillHierarchy/skillHierarchy.types";
import { INewOccupationToSkillPairSpec } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { INewSkillToSkillPairSpec } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { randomUUID } from "crypto";

export const getSampleESCOOccupationSpecs = (givenModelId: string): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length: 100 }, (_, i) => ({
    ISCOGroupCode: getMockRandomISCOGroupCode(),
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
    ISCOGroupCode: getMockRandomISCOGroupCode(),
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

export const getSampleISCOGroupSpecs = (givenModelId: string): INewISCOGroupSpec[] => {
  return Array.from<never, INewISCOGroupSpec>({ length: 100 }, (_, i) => ({
    code: getMockRandomISCOGroupCode(),
    preferredLabel: `ISCOGroup_${i}`,
    modelId: givenModelId,
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
  isco_groups: IISCOGroup[],
  esco_occupations: IOccupation[],
  local_occupations: IOccupation[]
): INewOccupationHierarchyPairSpec[] => {
  const specs: INewOccupationHierarchyPairSpec[] = [];
  let index = 0;
  isco_groups.forEach((iscoGroup) => {
    // add 1 occupation to each isco group
    if (index < esco_occupations.length) {
      specs.push({
        parentId: iscoGroup.id,
        parentType: ObjectTypes.ISCOGroup,
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
  return givenSkills.map((skill, i) => ({
    requiringOccupationType: givenOccupations[i].occupationType,
    requiredSkillId: skill.id,
    requiringOccupationId: givenOccupations[i].id,
    relationType: i % 2 ? RelationType.OPTIONAL : RelationType.ESSENTIAL,
  }));
};

export const getSampleSkillToSkillRelations = (givenSkills: ISkill[]): INewSkillToSkillPairSpec[] => {
  return givenSkills.map((skill, i) => ({
    requiringSkillId: givenSkills[i + 1]?.id ?? givenSkills[0].id,
    requiredSkillId: skill.id,
    relationType: RelationType.OPTIONAL,
  }));
};
