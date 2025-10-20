import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { IOccupation, INewOccupationSpec } from "./occupation.types";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { IOccupationGroupReference } from "esco/occupationGroup/OccupationGroup.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { ISkillReference } from "esco/skill/skills.types";

export function getIOccupationMockData(n: number = 1): IOccupation {
  const skillRef: OccupationToSkillReferenceWithRelationType<ISkillReference> = {
    id: getMockStringId(n + 10),
    UUID: randomUUID(),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: false,
    objectType: ObjectTypes.Skill,
    relationType: OccupationToSkillRelationType.ESSENTIAL,
  };

  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    modelId: getMockStringId(1000 + n),
    originUri: `https://example.com/${n}`,
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    occupationGroupCode: getRandomString(OccupationAPISpecs.Constants.OCCUPATION_GROUP_CODE_MAX_LENGTH),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [
      getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
      getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
    ],
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
    requiresSkills: [skillRef],
    parent: null,
    children: [],
    createdAt: new Date(2001, 0, n, 0, 0, 0),
    updatedAt: new Date(),
    importId: getMockStringId(n),
  };
}

export function getIOccupationMockDataWithOccupationChildren(n: number = 1): IOccupation {
  const child: IOccupationReference = {
    id: getMockStringId(n + 1),
    UUID: randomUUID(),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    occupationGroupCode: getRandomString(OccupationAPISpecs.Constants.OCCUPATION_GROUP_CODE_MAX_LENGTH),
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
  };
  return { ...getIOccupationMockData(n), children: [child] };
}

export function getIOccupationMockDataWithOccupationGroupChildren(n: number = 1): IOccupation {
  const child: IOccupationGroupReference = {
    id: getMockStringId(n + 1),
    UUID: randomUUID(),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    objectType: ObjectTypes.ISCOGroup,
  };
  return { ...getIOccupationMockData(n), children: [child] };
}

export function getIOccupationMockDataWithParentOccupation(n: number = 1): IOccupation {
  const parent: IOccupationReference = {
    id: getMockStringId(n + 1),
    UUID: randomUUID(),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    occupationGroupCode: getRandomString(OccupationAPISpecs.Constants.OCCUPATION_GROUP_CODE_MAX_LENGTH),
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
  };
  return { ...getIOccupationMockData(n), parent };
}

export function getIOccupationMockDataWithParentOccupationGroup(n: number = 1): IOccupation {
  const parent: IOccupationGroupReference = {
    id: getMockStringId(n + 1),
    UUID: randomUUID(),
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    objectType: ObjectTypes.ISCOGroup,
  };
  return { ...getIOccupationMockData(n), parent };
}

export function getNewOccupationSpec(): INewOccupationSpec {
  return {
    importId: getMockStringId(1),
    modelId: getMockStringId(1),
    occupationType: ObjectTypes.ESCOOccupation,
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: "https://example.com/new",
    UUIDHistory: [randomUUID()],
    code: getRandomString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
    occupationGroupCode: getRandomString(OccupationAPISpecs.Constants.OCCUPATION_GROUP_CODE_MAX_LENGTH),
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    regulatedProfessionNote: "",
    scopeNote: "",
    isLocalized: false,
  };
}
