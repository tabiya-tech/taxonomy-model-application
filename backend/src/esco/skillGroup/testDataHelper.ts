import { randomUUID } from "node:crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewSkillGroupSpec, ISkillGroup, ISkillGroupChild, ISkillGroupReference } from "./skillGroup.types";
import { getRandomString } from "_test_utilities/getMockRandomData";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { ISkillReference } from "esco/skill/skills.types";

export function getISkillGroupSkillGroupTypedChildData(
  n: number = 1,
  parentId: string = getMockStringId(1000 + n),
  modelId: string = getMockStringId(1000 + n)
): ISkillGroupChild {
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    parentId: parentId,
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
  };
}

export function getISkillGroupSkillTypedChildData(
  n: number = 1,
  parentId: string = getMockStringId(1000 + n),
  modelId: string = getMockStringId(1000 + n)
): ISkillGroupChild {
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    parentId: parentId,
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
    modelId: modelId,
    UUIDHistory: [randomUUID()],
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    isLocalized: true,
  };
}

export function getISkillGroupMockData(n: number = 1, modelId: string = getMockStringId(1000 + n)): ISkillGroup {
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    parents: [],
    children: [],
    importId: getMockStringId(n),
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
  };
}

export function getISkillGroupMockDataWithSkillGroupChildren(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): ISkillGroup {
  const children: ISkillGroupReference = {
    UUID: randomUUID(),
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    id: getMockStringId(n + 1),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
  };
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    parents: [],
    children: [children],
    importId: getMockStringId(n),
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
  };
}

export function getISkillGroupMockDataWithSkillChildren(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): ISkillGroup {
  const children: ISkillReference = {
    UUID: randomUUID(),
    id: getMockStringId(n + 1),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
    isLocalized: true,
  };
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    parents: [],
    children: [children],
    importId: getMockStringId(n),
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
  };
}

export function getISkillGroupMockDataWithSkillGroupParents(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): ISkillGroup {
  const parent: ISkillGroupReference = {
    UUID: randomUUID(),
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    id: getMockStringId(n + 1),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup,
  };
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    parents: [parent],
    children: [],
    importId: getMockStringId(n),
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
  };
}

export function getNewSkillGroupSpec(): INewSkillGroupSpec {
  return {
    UUIDHistory: [randomUUID()],
    code: getRandomString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/",
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    importId: getMockStringId(1),
    modelId: getMockStringId(1001),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
  };
}
