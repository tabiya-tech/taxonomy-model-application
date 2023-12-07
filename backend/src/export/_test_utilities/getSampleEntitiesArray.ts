import { INewOccupationSpec, IOccupation } from "esco/occupation/occupation.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes, OccupationType, RelationType } from "esco/common/objectTypes";
import { INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationHierarchyPairSpec } from "esco/occupationHierarchy/occupationHierarchy.types";
import { INewSkillHierarchyPairSpec } from "esco/skillHierarchy/skillHierarchy.types";
import { INewOccupationToSkillPairSpec } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { INewSkillToSkillPairSpec } from "esco/skillToSkillRelation/skillToSkillRelation.types";

export const getSampleOccupationSpecs = (givenModelId: string, isLocal: boolean = false): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length: 100 }, (_, i) => ({
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    definition: `definition_${i}`,
    regulatedProfessionNote: `regulatedProfessionNote_${i}`,
    scopeNote: `scopeNote_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    code: getMockRandomOccupationCode(isLocal),
    preferredLabel: `Occupation_${i}`,
    modelId: givenModelId,
    originUUID: ``,
    ESCOUri: `ESCOUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
    occupationType: isLocal ? OccupationType.LOCAL : OccupationType.ESCO,
  }));
};
export const getSampleLocalizedOccupationSpecs = (
  givenEscoOccupations: IOccupation[]
): INewLocalizedOccupationSpec[] => {
  return givenEscoOccupations.map((occupation, i) => ({
    localizesOccupationId: occupation.id,
    altLabels: i % 2 ? [] : [`altLabel_1`, `altLabel_2`],
    modelId: occupation.modelId,
    description: `description_${i}`,
    importId: `importId_${i}`,
    occupationType: OccupationType.LOCALIZED,
  }));
};

export const getSampleISCOGroupSpecs = (givenModelId: string): INewISCOGroupSpec[] => {
  return Array.from<never, INewISCOGroupSpec>({ length: 100 }, (_, i) => ({
    code: getMockRandomISCOGroupCode(),
    preferredLabel: `ISCOGroup_${i}`,
    modelId: givenModelId,
    originUUID: ``,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    ESCOUri: `ESCOUri_${i}`,
    description: `description_${i}`,
    importId: `importId_${i}`,
  }));
};

export const getSampleSkillsSpecs = (givenModelId: string): INewSkillSpec[] => {
  return Array.from<never, INewSkillSpec>({ length: 100 }, (_, i) => ({
    preferredLabel: `Skill_${i}`,
    modelId: givenModelId,
    originUUID: ``,
    ESCOUri: `ESCOUri_${i}`,
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
    originUUID: ``,
    ESCOUri: `ESCOUri_${i}`,
    description: `description_${i}`,
    scopeNote: `scopeNote_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    importId: `importId_${i}`,
  }));
};

export const getSampleOccupationHierarchy = (givenModelId: string): INewOccupationHierarchyPairSpec[] => {
  return Array.from<never, INewOccupationHierarchyPairSpec>({ length: 100 }, (_, i) => ({
    parentId: getMockStringId(999),
    parentType: ObjectTypes.Occupation,
    childType: ObjectTypes.Occupation,
    childId: getMockStringId(i),
    modelId: givenModelId,
    importId: `importId_${i}`,
  }));
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
    modelId: skill.modelId,
  }));
};

export const getSampleOccupationToSkillRelations = (
  givenOccupations: IOccupation[],
  givenSkills: ISkill[]
): INewOccupationToSkillPairSpec[] => {
  return givenSkills.map((skill, i) => ({
    requiringOccupationType: OccupationType.LOCAL,
    requiredSkillId: skill.id,
    requiringOccupationId: givenOccupations[i].id,
    relationType: RelationType.OPTIONAL,
  }));
};

export const getSampleSkillToSkillRelations = (givenSkills: ISkill[]): INewSkillToSkillPairSpec[] => {
  return givenSkills.map((skill, i) => ({
    requiringSkillId: givenSkills[i + 1]?.id ?? givenSkills[0].id,
    requiredSkillId: skill.id,
    relationType: RelationType.OPTIONAL,
  }));
};
