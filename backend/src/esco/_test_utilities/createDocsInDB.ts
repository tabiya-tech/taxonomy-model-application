import { randomUUID } from "node:crypto";
import LocaleAPISpecs from "api-specifications/locale";
import SkillAPISpecs from "api-specifications/esco/skill";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { ObjectTypes } from "esco/common/objectTypes";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { INewSkillHierarchyPairSpec } from "esco/skillHierarchy/skillHierarchy.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { INewOccupationGroupSpec } from "../occupationGroup/_shared/OccupationGroup.types";

export async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
}

export async function createSkillGroupInDB(modelId: string): Promise<ISkillGroup> {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    code: getTestSkillGroupCode(100),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
  });
}

export async function createSkillInDB(modelId: string): Promise<ISkill> {
  return await getRepositoryRegistry().skill.create({
    modelId: modelId,
    preferredLabel: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    definition: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
    reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
    isLocalized: true,
  });
}

export async function createSkillGroupsInDB(count: number, modelId: string): Promise<ISkillGroup[]> {
  const skillGroups: ISkillGroup[] = [];
  for (let i = 0; i < count; i++) {
    skillGroups.push(await createSkillGroupInDB(modelId));
  }
  return skillGroups;
}

export async function createSkillsInDB(count: number, modelId: string): Promise<ISkill[]> {
  const skills: ISkill[] = [];
  for (let i = 0; i < count; i++) {
    skills.push(await createSkillInDB(modelId));
  }
  return skills;
}

export async function linkSkillGroupToSkillChildrenInDB(
  modelId: string,
  parentSkillGroup: ISkillGroup,
  childrenSkills: ISkill[]
): Promise<void> {
  const newHierarchySpecs: INewSkillHierarchyPairSpec[] = childrenSkills.map((skill) => ({
    parentId: parentSkillGroup.id.toString(),
    parentType: ObjectTypes.SkillGroup,
    childId: skill.id.toString(),
    childType: ObjectTypes.Skill,
  }));
  await getRepositoryRegistry().skillHierarchy.createMany(modelId, newHierarchySpecs);
}
function getRandomOccupationGroup(modelId: string) {
  return {
    modelId: modelId,
    code: getMockRandomISCOGroupCode(),
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `https://example.com/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
  };
}

export async function createOccupationGroupInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().OccupationGroup.create(getRandomOccupationGroup(modelId));
}

export async function createChildOccupationGroups(parentOccupationGroup: string, count: number) {
  const parentOccupationGroupDoc = await getRepositoryRegistry().OccupationGroup.findById(parentOccupationGroup);
  if (!parentOccupationGroupDoc)
    throw new Error(`Invalid parentOccupationGroup: ${parentOccupationGroup}. Create it first.`);

  const childrenDocs: INewOccupationGroupSpec[] = [];

  for (let i = 0; i < count; i++) {
    const occupationGroup = getRandomOccupationGroup(parentOccupationGroupDoc.modelId.toString() || "");
    occupationGroup.code = `${parentOccupationGroupDoc.code}${getMockRandomISCOGroupCode()}`;
    childrenDocs.push({
      ...occupationGroup,
      importId: getMockStringId(1000),
    });
  }

  const createdOccupationGroups = await getRepositoryRegistry().OccupationGroup.createMany(childrenDocs);
  if (createdOccupationGroups.length != count) throw new Error("Failed to create occupation groups");

  const hierarchySpecs = [];
  for (const occupation of createdOccupationGroups) {
    hierarchySpecs.push({
      parentId: parentOccupationGroupDoc.id,
      parentType: parentOccupationGroupDoc.groupType,
      childId: occupation.id,
      childType: occupation.groupType,
    });
  }

  const createdHierarchies = await getRepositoryRegistry().occupationHierarchy.createMany(
    parentOccupationGroupDoc.modelId,
    hierarchySpecs
  );
  if (createdHierarchies.length != count) throw new Error("Failed to create occupation hierarchy");

  return createdOccupationGroups;
}
