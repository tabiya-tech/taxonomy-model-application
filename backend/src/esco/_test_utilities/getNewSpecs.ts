import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { generateRandomUrl, getRandomString, getTestString } from "_test_utilities/specialCharacters";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationSpec } from "esco/occupation/occupation.types";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { INewSkillGroupSpec } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { INewSkillSpec, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { randomUUID } from "crypto";
import { OccupationType } from "esco/common/objectTypes";
import { INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";

/**
 * Helper function to create an INewISCOGroupSpec with random values,
 * that can be used for creating a new ISCOGroup
 */
export function getNewISCOGroupSpec(): INewISCOGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an INewISCOGroupSpec with the simplest possible values,
 * that can be used for creating a new ISCOGroup
 */
export function getSimpleNewISCOGroupSpec(modelId: string, preferredLabel: string): INewISCOGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    ESCOUri: "",
    description: "",
    importId: "",
  };
}

/**
 * Helper function to create an INewOccupationSpec with random values,
 * that can be used for creating a new Occupation
 */
export function getNewOccupationSpec(isLocal: boolean = false): INewOccupationSpec {
  return {
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    definition: getTestString(DESCRIPTION_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getRandomString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomOccupationCode(isLocal),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    originUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    occupationType: isLocal ? OccupationType.LOCAL : OccupationType.ESCO,
  };
}

/**
 * Helper function to create an INewOccupationSpec with simplest possible values,
 * that can be used for creating a new Occupation
 */
export function getSimpleNewOccupationSpec(
  modelId: string,
  preferredLabel: string,
  isLocal: boolean = false
): INewOccupationSpec {
  return {
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    code: getMockRandomOccupationCode(isLocal),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    description: "",
    importId: "",
    occupationType: isLocal ? OccupationType.LOCAL : OccupationType.ESCO,
  };
}

/**
 * Helper function to create an INewLocalizedOccupationSpec with random values,
 * that can be used for creating a new Localized Occupation
 */
export function getNewLocalizedOccupationSpec(
  localizedFromId: string = getMockStringId(999)
): INewLocalizedOccupationSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    modelId: getMockStringId(2),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    occupationType: OccupationType.LOCALIZED,
    localizesOccupationId: localizedFromId,
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  };
}

/**
 * Helper function to create an INewLocalizedOccupationSpec with the simplest possible values,
 * that can be used for creating a new Localized Occupation
 */
export function getSimpleNewLocalizedOccupationSpec(
  modelId: string,
  localizedFromId: string
): INewLocalizedOccupationSpec {
  return {
    altLabels: [],
    modelId: modelId,
    description: "",
    occupationType: OccupationType.LOCALIZED,
    localizesOccupationId: localizedFromId,
    importId: "",
    UUIDHistory: [randomUUID()],
  };
}

/**
 * Helper function to create an INewSkillGroupSpec with random values,
 * that can be used for creating a new ISkillGroup
 */
export function getNewSkillGroupSpec(): INewSkillGroupSpec {
  return {
    code: getMockRandomSkillCode(),
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    ESCOUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [getTestString(LABEL_MAX_LENGTH, "1_"), getTestString(LABEL_MAX_LENGTH, "2_")],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an INewSkillGroupSpec with simplest possible values,
 * that can be used for creating a new Occupation
 */
export function getSimpleNewSkillGroupSpec(modelId: string, preferredLabel: string): INewSkillGroupSpec {
  return {
    code: getMockRandomSkillCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    ESCOUri: "",
    description: "",
    scopeNote: "",
    altLabels: [],
    importId: "",
  };
}

/**
 * Helper function to create an INewSkillSpec with random values,
 * that can be used for creating a new ISkill
 */
export function getNewSkillSpec(): INewSkillSpec {
  return {
    preferredLabel: getTestString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    ESCOUri: generateRandomUrl(),
    definition: getTestString(DEFINITION_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    skillType: SkillType.Knowledge,
    reuseLevel: ReuseLevel.CrossSector,
    altLabels: [getTestString(LABEL_MAX_LENGTH, "1_"), getTestString(LABEL_MAX_LENGTH, "2_")],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an INewSkillSpec with simplest possible values,
 * that can be used for creating a new Occupation
 */
export function getSimpleNewSkillSpec(modelId: string, preferredLabel: string): INewSkillSpec {
  return {
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    ESCOUri: "",
    definition: "",
    description: "",
    scopeNote: "",
    skillType: SkillType.Knowledge,
    reuseLevel: ReuseLevel.CrossSector,
    altLabels: [],
    importId: "",
  };
}
