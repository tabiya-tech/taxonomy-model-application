import { Entity, IModel, Occupation, OccupationGroup, Skill, SkillGroup } from "scripts/modelDiff/types";
import { ArrayChange, Change as WordsChange, diffArrays, diffWords } from "diff";

enum ChangeType {
  MISSING = "missing",
  NOT_EQUAL = "not-equal",
}

type Change = {
  type: ChangeType;
  label?: string;
  entityType: "skill" | "occupation" | "skillGroup" | "occupationGroup";
  identifier: string;
  entity: string;
  modelId: string;
  changes?: WordsChange[] | ArrayChange<string>[];
};

function compareEntities(
  model: IModel,
  entity1: Entity,
  entity2: Entity,
  differences: Change[],
  entityName: "skill" | "occupation" | "skillGroup" | "occupationGroup"
) {
  if (entity1.row.PREFERREDLABEL !== entity2.row.PREFERREDLABEL) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "preferredLabel",
      identifier: entity1.row.ID,
      changes: diffWords(entity1.row.PREFERREDLABEL, entity2.row.PREFERREDLABEL),
      entity: entity1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (entity1.row.DESCRIPTION !== entity2.row.DESCRIPTION) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "description",
      changes: diffWords(entity1.row.DESCRIPTION, entity2.row.DESCRIPTION),
      identifier: entity1.row.ID,
      entity: entity1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (entity1.row.ALTLABELS !== entity2.row.ALTLABELS) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: entityName,
      label: "altLabels",
      changes: diffWords(entity1.row.ALTLABELS, entity2.row.ALTLABELS),
      identifier: entity1.row.ID,
      entity: entity1.originalUUID,
      modelId: model._modelId,
    });
  }
}

function arrayMatch(array1: string[], array2: string[]) {
  const sortStrings = (a: string, b: string) => a.localeCompare(b);

  array1.sort(sortStrings);
  array2.sort(sortStrings);

  const diff = diffArrays(array1, array2);

  return diff.every((part) => part.added === false && part.removed === false);
}

function compareSkill(model: IModel, skill1: Skill, skill2: Skill, differences: Change[]) {
  compareEntities(model, skill1, skill2, differences, "skill");

  if (!arrayMatch(skill1.occupations, skill2.occupations)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skill",
      label: "occupations",
      identifier: skill1.row.ID,
      changes: diffArrays(skill1.occupations, skill2.occupations),
      entity: skill1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(skill1.parents, skill2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skill",
      label: "parents",
      identifier: skill1.row.ID,
      changes: diffArrays(skill1.parents, skill2.parents),
      entity: skill1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(skill1.children, skill2.children)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skill",
      label: "children",
      identifier: skill1.row.ID,
      changes: diffArrays(skill1.children, skill2.children),
      entity: skill1.originalUUID,
      modelId: model._modelId,
    });
  }
}

function compareOccupation(model: IModel, occupation1: Occupation, occupation2: Occupation, differences: Change[]) {
  compareEntities(model, occupation1, occupation2, differences, "occupation");

  if (!arrayMatch(occupation1.skills, occupation2.skills)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupation",
      label: "skills",
      identifier: occupation1.row.CODE,
      changes: diffArrays(occupation1.skills, occupation2.skills),
      entity: occupation1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(occupation1.parents, occupation2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupation",
      label: "parents",
      identifier: occupation1.row.CODE,
      changes: diffArrays(occupation1.parents, occupation2.parents),
      entity: occupation1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(occupation1.children, occupation2.children)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupation",
      label: "children",
      identifier: occupation1.row.CODE,
      changes: diffArrays(occupation1.children, occupation2.children),
      entity: occupation1.originalUUID,
      modelId: model._modelId,
    });
  }
}

function compareSkillGroup(model: IModel, skillGroup1: SkillGroup, skillGroup2: SkillGroup, differences: Change[]) {
  compareEntities(model, skillGroup1, skillGroup2, differences, "skillGroup");

  if (!arrayMatch(skillGroup1.parents, skillGroup2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skillGroup",
      label: "parents",
      identifier: skillGroup1.row.ID,
      changes: diffArrays(skillGroup1.parents, skillGroup2.parents),
      entity: skillGroup1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(skillGroup1.children, skillGroup2.children)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skillGroup",
      label: "children",
      identifier: skillGroup1.row.ID,
      changes: diffArrays(skillGroup1.children, skillGroup2.children),
      entity: skillGroup1.originalUUID,
      modelId: model._modelId,
    });
  }
}

function compareOccupationGroup(
  model: IModel,
  occupationGroup1: OccupationGroup,
  occupationGroup2: OccupationGroup,
  differences: Change[]
) {
  compareEntities(model, occupationGroup1, occupationGroup2, differences, "occupationGroup");

  if (!arrayMatch(occupationGroup1.parents, occupationGroup2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupationGroup",
      label: "parents",
      identifier: occupationGroup1.row.CODE,
      changes: diffArrays(occupationGroup1.parents, occupationGroup2.parents),
      entity: occupationGroup1.originalUUID,
      modelId: model._modelId,
    });
  }

  if (!arrayMatch(occupationGroup1.children, occupationGroup2.children)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupationGroup",
      label: "children",
      identifier: occupationGroup1.row.CODE,
      changes: diffArrays(occupationGroup1.children, occupationGroup2.children),
      entity: occupationGroup1.originalUUID,
      modelId: model._modelId,
    });
  }
}

function compareSkills(model1: IModel, model2: IModel, differences: Change[]) {
  const model1Skills = model1._csvEntities.skills;

  for (const model1Skill of model1Skills) {
    // Get the corresponding skill from model2
    const model2Skill = model2.getSKillByOriginalUUID(model1Skill.originalUUID);

    // If the skill is not found in model2, it means it's missing.
    if (!model2Skill) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "skill",
        identifier: model1Skill.row.ID,
        entity: model1Skill.originalUUID,
        modelId: model1._modelId,
      });
    } else {
      // Otherwise, compare the two skills and if any differences found, push them to the differences array.
      // Compare Skill will check if there fields in the model1Skill and model2Skill are not equal.
      compareSkill(model1, model1Skill, model2Skill, differences);
    }
  }

  // THEN: find the skills that are in model2 but not in model1.
  const model2Skills = model2._csvEntities.skills;
  for (const model2Skill of model2Skills) {
    const model1Skill = model1.getSKillByOriginalUUID(model2Skill.originalUUID);
    if (!model1Skill) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "skill",
        identifier: model2Skill.row.ID,
        entity: model2Skill.originalUUID,
        modelId: model2._modelId,
      });
    }
  }
}

function compareOccupations(model1: IModel, model2: IModel, differences: Change[]) {
  const model1Occupations = model1._csvEntities.occupations;

  for (const model1Occupation of model1Occupations) {
    const model2Occupation = model2.getOccupationByOriginalUUID(model1Occupation.originalUUID);
    if (!model2Occupation) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "occupation",
        identifier: model1Occupation.row.CODE,
        entity: model1Occupation.originalUUID,
        modelId: model1._modelId,
      });
    } else {
      compareOccupation(model1, model1Occupation, model2Occupation, differences);
    }
  }

  const model2Occupations = model2._csvEntities.occupations;
  for (const model2Occupation of model2Occupations) {
    const model1Occupation = model1.getOccupationByOriginalUUID(model2Occupation.originalUUID);
    if (!model1Occupation) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "occupation",
        identifier: model2Occupation.row.CODE,
        entity: model2Occupation.originalUUID,
        modelId: model2._modelId,
      });
    }
  }
}

function compareSkillGroups(model1: IModel, model2: IModel, differences: Change[]) {
  const model1SkillGroups = model1._csvEntities.skillGroups;

  for (const model1SkillGroup of model1SkillGroups) {
    const model2SkillGroup = model2.getSkillGroupByOriginalUUID(model1SkillGroup.originalUUID);
    if (!model2SkillGroup) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "skillGroup",
        identifier: model1SkillGroup.row.ID,
        entity: model1SkillGroup.originalUUID,
        modelId: model1._modelId,
      });
    } else {
      compareSkillGroup(model1, model1SkillGroup, model2SkillGroup, differences);
    }
  }

  const model2SkillGroups = model2._csvEntities.skillGroups;
  for (const model2SkillGroup of model2SkillGroups) {
    const model1SkillGroup = model1.getSkillGroupByOriginalUUID(model2SkillGroup.originalUUID);
    if (!model1SkillGroup) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "skillGroup",
        identifier: model2SkillGroup.row.ID,
        entity: model2SkillGroup.originalUUID,
        modelId: model2._modelId,
      });
    }
  }
}

function compareOccupationGroups(model1: IModel, model2: IModel, differences: Change[]) {
  const model1OccupationGroups = model1._csvEntities.occupationGroups;

  for (const model1OccupationGroup of model1OccupationGroups) {
    const model2OccupationGroup = model2.getOccupationGroupByOriginalUUID(model1OccupationGroup.originalUUID);
    if (!model2OccupationGroup) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "occupationGroup",
        identifier: model1OccupationGroup.row.CODE,
        entity: model1OccupationGroup.originalUUID,
        modelId: model1._modelId,
      });
    } else {
      compareOccupationGroup(model1, model1OccupationGroup, model2OccupationGroup, differences);
    }
  }

  const model2OccupationGroups = model2._csvEntities.occupationGroups;
  for (const model2OccupationGroup of model2OccupationGroups) {
    const model1OccupationGroup = model1.getOccupationGroupByOriginalUUID(model2OccupationGroup.originalUUID);
    if (!model1OccupationGroup) {
      differences.push({
        type: ChangeType.MISSING,
        entityType: "occupationGroup",
        identifier: model2OccupationGroup.row.CODE,
        entity: model2OccupationGroup.originalUUID,
        modelId: model2._modelId,
      });
    } else {
      compareEntities(model2, model2OccupationGroup, model1OccupationGroup, differences, "occupationGroup");
    }
  }
}

export function findDifferences(model1: IModel, model2: IModel) {
  // Initialize an empty array to store the differences
  // Because Javascript reference arrays by reference, It will be appended everytime the comparing functions appends on it.
  const differences: Change[] = [];

  // Find the differences and append them to the differences array
  compareSkills(model1, model2, differences);
  compareOccupations(model1, model2, differences);
  compareSkillGroups(model1, model2, differences);
  compareOccupationGroups(model1, model2, differences);

  // Return the array of differences
  return differences;
}
