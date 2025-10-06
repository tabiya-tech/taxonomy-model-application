import { INewOccupationGroupSpec } from "esco/occupationGroup/OccupationGroup.types";
import { generateRandomUrl, getRandomBoolean, getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import {
  DEFINITION_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  IMPORT_ID_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  SCOPE_NOTE_MAX_LENGTH,
} from "esco/common/modelSchema";
import { getMockRandomISCOGroupCode, getMockRandomLocalGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationSpec } from "esco/occupations/occupation.types";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { INewSkillGroupSpec } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { INewSkillSpec, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { randomUUID } from "crypto";
import { ObjectTypes } from "esco/common/objectTypes";

/**
 * Helper functions to create an INewOccupationGroupSpec with random values,
 * that can be used for creating a new OccupationGroup
 */
export function getNewISCOGroupSpecs(leafNode: boolean = false): INewOccupationGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: leafNode ? getMockRandomISCOGroupCode().padStart(4, "0") : getMockRandomISCOGroupCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    originUri: generateRandomUrl(),
    groupType: ObjectTypes.ISCOGroup,
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

export function getNewLocalGroupSpecs(): INewOccupationGroupSpec {
  return {
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomLocalGroupCode(),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(2),
    UUIDHistory: [randomUUID()],
    originUri: generateRandomUrl(),
    groupType: ObjectTypes.LocalGroup,
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
  };
}

/**
 * Helper function to create an INewOccupationGroupSpec with simplest possible values,
 * that can be used for creating a new OccupationGroup
 */
export function getSimpleNewISCOGroupSpec(
  modelId: string,
  preferredLabel: string,
  leafNode: boolean = false
): INewOccupationGroupSpec {
  return {
    altLabels: [],
    code: leafNode ? getMockRandomISCOGroupCode().padStart(4, "0") : getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    groupType: ObjectTypes.ISCOGroup,
    description: "",
    importId: getMockStringId(Math.random() * 1000),
  };
}

export function getSimpleNewLocalGroupSpec(modelId: string, preferredLabel: string): INewOccupationGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomLocalGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    groupType: ObjectTypes.LocalGroup,
    description: "",
    importId: getMockStringId(Math.random() * 1000),
  };
}

/**
 * Helper function to create an ISCO group that obeys the rules about the code needing to start with it's parent's code
 */
export function getSimpleNewISCOGroupSpecWithParentCode(
  modelId: string,
  preferredLabel: string,
  parentCode: string,
  leafNode: boolean = false
): INewOccupationGroupSpec {
  const ISCOGroupSpec = getSimpleNewISCOGroupSpec(modelId, preferredLabel, leafNode);
  const code = leafNode ? parentCode + ISCOGroupSpec.code.slice(parentCode.length) : parentCode + ISCOGroupSpec.code;
  return {
    ...ISCOGroupSpec,
    code: code,
  };
}

/**
 * Helper function to create a Local group that obeys the rules about the code needing to start with it's parent's code
 */
export function getSimpleNewLocalGroupSpecWithParentCode(
  modelId: string,
  preferredLabel: string,
  parentCode: string,
  leafNode: boolean = false
): INewOccupationGroupSpec {
  const LocalGroupSpec = getSimpleNewLocalGroupSpec(modelId, preferredLabel);
  const code = leafNode ? parentCode + LocalGroupSpec.code.slice(parentCode.length) : parentCode + LocalGroupSpec.code;
  return {
    ...LocalGroupSpec,
    code: code,
  };
}

/**
 * Helper functions to create an INewOccupationSpec with random values,
 * that can be used for creating a new Occupation
 */
export function getNewESCOOccupationSpec(): INewOccupationSpec {
  return {
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: getTestString(DESCRIPTION_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getRandomString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomOccupationCode(false),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(Math.floor(Math.random() * 100000)),
    UUIDHistory: [randomUUID()],
    originUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
  };
}

export function getNewLocalizedESCOOccupationSpec(): INewOccupationSpec {
  const spec = getNewESCOOccupationSpec();
  spec.isLocalized = true;
  return spec;
}

export function getNewLocalOccupationSpec(): INewOccupationSpec {
  return {
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: getTestString(DESCRIPTION_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getRandomString(SCOPE_NOTE_MAX_LENGTH),
    altLabels: [getRandomString(LABEL_MAX_LENGTH), getRandomString(LABEL_MAX_LENGTH)],
    code: getMockRandomOccupationCode(true),
    preferredLabel: getRandomString(LABEL_MAX_LENGTH),
    modelId: getMockStringId(Math.floor(Math.random() * 100000)),
    UUIDHistory: [randomUUID()],
    originUri: generateRandomUrl(),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    occupationType: ObjectTypes.LocalOccupation,
    isLocalized: false,
  };
}

/**
 * Helper function to create an INewOccupationSpec with simplest possible values,
 * that can be used for creating a new Occupation
 */
export function getSimpleNewESCOOccupationSpec(modelId: string, preferredLabel: string): INewOccupationSpec {
  return {
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    code: getMockRandomOccupationCode(false),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    description: "",
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
  };
}

export function getSimpleNewLocalizedESCOOccupationSpec(modelId: string, preferredLabel: string) {
  const occ = getSimpleNewESCOOccupationSpec(modelId, preferredLabel);
  occ.isLocalized = true;
  return occ;
}
export function getSimpleNewLocalOccupationSpec(modelId: string, preferredLabel: string): INewOccupationSpec {
  return {
    occupationGroupCode: getMockRandomISCOGroupCode(),
    definition: "",
    regulatedProfessionNote: "",
    scopeNote: "",
    altLabels: [],
    code: getMockRandomOccupationCode(true),
    preferredLabel: preferredLabel,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "",
    description: "",
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    occupationType: ObjectTypes.LocalOccupation,
    isLocalized: false,
  };
}

/**
 * Helper function to create an esco occupation that obeys the rules about the code needing to start with it's parent's code
 */
export function getSimpleNewESCOOccupationSpecWithParentCode(
  modelId: string,
  preferredLabel: string,
  parentCode: string
): INewOccupationSpec {
  const ESCOOccupationSpec = getSimpleNewESCOOccupationSpec(modelId, preferredLabel);
  const separator = ".";
  const lastSegment = ESCOOccupationSpec.code.split(separator).pop();
  return {
    ...ESCOOccupationSpec,
    code: parentCode + separator + lastSegment,
  };
}

/**
 * Helper function to create an esco localized occupation that obeys the rules about the code needing to start with it's parent's code
 */
export function getSimpleNewLocalizedESCOOccupationSpecWithParentCode(
  parentCode: string,
  modelId: string,
  preferredLabel: string
): INewOccupationSpec {
  const ESCOOccupationSpec = getSimpleNewLocalizedESCOOccupationSpec(modelId, preferredLabel);
  const separator = ".";
  const lastSegment = ESCOOccupationSpec.code.split(separator).pop();
  return {
    ...ESCOOccupationSpec,
    code: parentCode + separator + lastSegment,
  };
}

/**
 * Helper function to create an local occupation that obeys the rules about the code needing to start with it's parent's code
 */
export function getSimpleNewLocalOccupationSpecWithParentCode(
  modelId: string,
  preferredLabel: string,
  parentCode: string
): INewOccupationSpec {
  const LocalOccupationSpec = getSimpleNewLocalOccupationSpec(modelId, preferredLabel);
  const separator = "_";
  const lastSegment = LocalOccupationSpec.code.split(separator).pop();
  return {
    ...LocalOccupationSpec,
    code: parentCode + separator + lastSegment,
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
    originUri: generateRandomUrl(),
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
    originUri: "",
    description: "",
    scopeNote: "",
    altLabels: [],
    importId: getMockStringId(Math.random() * 1000),
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
    originUri: generateRandomUrl(),
    definition: getTestString(DEFINITION_MAX_LENGTH),
    description: getTestString(DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SCOPE_NOTE_MAX_LENGTH),
    skillType: SkillType.Knowledge,
    reuseLevel: ReuseLevel.CrossSector,
    altLabels: [getTestString(LABEL_MAX_LENGTH, "1_"), getTestString(LABEL_MAX_LENGTH, "2_")],
    importId: getTestString(IMPORT_ID_MAX_LENGTH),
    isLocalized: getRandomBoolean(),
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
    originUri: "",
    definition: "",
    description: "",
    scopeNote: "",
    skillType: SkillType.Knowledge,
    reuseLevel: ReuseLevel.CrossSector,
    altLabels: [],
    importId: getMockStringId(Math.random() * 1000),
    isLocalized: false,
  };
}
