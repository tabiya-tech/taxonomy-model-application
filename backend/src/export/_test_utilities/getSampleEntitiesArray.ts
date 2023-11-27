import { INewOccupationSpec } from "esco/occupation/occupation.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { OccupationType } from "esco/common/objectTypes";
import { INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";
import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { INewSkillSpec, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getMockStringId } from "_test_utilities/mockMongoId";

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
export const getSampleLocalizedOccupationSpecs = (givenModelId: string): INewLocalizedOccupationSpec[] => {
  return Array.from<never, INewLocalizedOccupationSpec>({ length: 100 }, (_, i) => ({
    localizesOccupationId: getMockStringId(i),
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    modelId: givenModelId,
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
