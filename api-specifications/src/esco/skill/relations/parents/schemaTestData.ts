import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import SkillConstants from "../../constants";
import SkillGroupConstants from "../../../skillGroup/constants";
import SkillEnums from "../../enums";
import { getTestSkillGroupCode } from "../../../_test_utilities/testUtils";

export function getValidSkillGroupParentItem() {
  return {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH)],
    description: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH),
    modelId: getMockId(1),
    parents: [],
    children: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getValidSkillParentItem() {
  return {
    id: getMockId(2),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(SkillConstants.DEFINITION_MAX_LENGTH),
    description: getTestString(SkillConstants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SkillConstants.SCOPE_NOTE_MAX_LENGTH),
    skillType: SkillEnums.SkillType.Knowledge,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    modelId: getMockId(1),
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getValidSkillParentsPaginatedResponse(
  options: {
    data?: (ReturnType<typeof getValidSkillParentItem> | ReturnType<typeof getValidSkillGroupParentItem>)[];
    limit?: number;
    nextCursor?: string | null;
  } = {}
) {
  const { data = [], limit = SkillConstants.DEFAULT_LIMIT, nextCursor = null } = options;
  return { data, limit, nextCursor };
}

export function getValidSkillRelationRequestQuery() {
  return {
    limit: SkillConstants.DEFAULT_LIMIT,
    cursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };
}
