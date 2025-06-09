import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { Change, ChangeType, ESCOEntityService, Skill } from "./types";
import { arrayMatch, compareESCOEntity, parseUUIDHistory, readCSV } from "./common";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { IModelManager } from "../model/types";
import { diffArrays } from "diff";

function loadSkill(modelManager: IModelManager, skill: Skill) {
  // Add occupations.
  const relations = modelManager.getOccupationToSKillsRelationsBySkillId(skill.row.ID);
  for (const _relation of relations) {
    const occupation = modelManager.getOccupationById(_relation?.OCCUPATIONID);
    skill.occupations.push(occupation!.originalUUID);
  }

  // Add parents
  const parents = modelManager.getSkillParentBySkillId(skill.row.ID);
  for (const _parent of parents) {
    if (_parent.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const skillGroup = modelManager.getSkillGroupById(_parent.PARENTID);
      skill.parents.push(`${_parent.PARENTOBJECTTYPE}@${skillGroup!.originalUUID}`);
    }

    if (_parent.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = modelManager.getSkillById(_parent.PARENTID);
      skill.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add children
  const children = modelManager.getSkillChildrenBySkillId(skill.row.ID);
  for (const _child of children) {
    if (_child.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const skillGroup = modelManager.getSkillGroupById(_child.PARENTID);
      skill.children.push(`${_child.PARENTOBJECTTYPE}@${skillGroup!.originalUUID}`);
    }

    if (_child.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = modelManager.getSkillById(_child.PARENTID);
      skill.children.push(`${_child.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

function compareSkill(model: IModelManager, skill1: Skill, skill2: Skill, differences: Change[]) {
  compareESCOEntity(model, skill1, skill2, differences, "skill");

  if (!arrayMatch(skill1.occupations, skill2.occupations)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skill",
      label: "occupations",
      identifier: skill1.row.ID,
      changes: diffArrays(skill1.occupations, skill2.occupations),
      entity: skill1.originalUUID,
      entityLabel: skill1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: skill1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: skill1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }
}

export class SkillsService extends ESCOEntityService {
  static compareEntities(modelManager1: IModelManager, modelManager2: IModelManager, differences: Change[]) {
    const model1Skills = modelManager1.state.skills;

    for (const model1Skill of model1Skills) {
      // Get the corresponding skill from model2
      const model2Skill = modelManager2.getSKillByOriginalUUID(model1Skill.originalUUID);

      // If the skill is not found in model2, it means it's missing.
      if (!model2Skill) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "skill",
          identifier: model1Skill.row.ID,
          entity: model1Skill.originalUUID,
          entityLabel: model1Skill.row.PREFERREDLABEL,
          modelId: modelManager1.state.modelId,
          modelName: modelManager1.state.getModelName()
        });
      } else {
        // Otherwise, compare the two skills and if any differences found, push them to the differences array.
        // Compare Skill will check if there fields in the model1Skill and model2Skill are not equal.
        compareSkill(modelManager1, model1Skill, model2Skill, differences);
      }
    }

    // THEN: find the skills that are in model2 but not in model1.
    const model2Skills = modelManager2.state.skills;
    for (const model2Skill of model2Skills) {
      const model1Skill = modelManager1.getSKillByOriginalUUID(model2Skill.originalUUID);
      if (!model1Skill) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "skill",
          identifier: model2Skill.row.ID,
          entity: model2Skill.originalUUID,
          entityLabel: model2Skill.row.PREFERREDLABEL,
          modelId: modelManager2.state.modelId,
          modelName: modelManager2.state.getModelName()
        });
      }
    }
  }

  async loadFromCSV(): Promise<void> {
    const result = await readCSV<ISkillImportRow>(path.join(this.modelManager.state.modelPath, FILENAMES.Skills));

    this.modelManager.state.skills = result.rows.map((row) => {
      const result = {
        row,
        ...parseUUIDHistory(row.UUIDHISTORY),
        altLabels: arrayFromString(row.ALTLABELS),
        occupations: [],

        parents: [],
        children: [],
      };

      this.modelManager.caches.skills.set(result.originalUUID, result);

      return result;
    });
  }

  loadRelations() {
    const skills = this.modelManager.state.skills;
    for (const skill of skills) {
      loadSkill(this.modelManager, skill);
    }

    this.modelManager.state.skills = skills;
  }
}
