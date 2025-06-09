import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { arrayMatch, compareESCOEntity, parseUUIDHistory, readCSV } from "./common";
import { ObjectTypes } from "esco/common/objectTypes";
import { Change, ChangeType, ESCOEntityService, SkillGroup } from "./types";
import { IModelManager } from "scripts/modelDiff/model/types";
import { ISkillGroupImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { diffArrays } from "diff";

function loadSkillGroup(model: IModelManager, skillGroup: SkillGroup) {
  // Add parents
  const parents = model.getSkillParentBySkillId(skillGroup.row.ID);
  for (const _parent of parents) {
    if (_parent.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const _skillGroup = model.getSkillGroupById(_parent.PARENTID);
      skillGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_skillGroup!.originalUUID}`);
    }

    if (_parent.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_parent.PARENTID);
      skillGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add children
  const children = model.getSkillChildrenBySkillId(skillGroup.row.ID);
  for (const _child of children) {
    if (_child.CHILDOBJECTTYPE == ObjectTypes.SkillGroup) {
      const _skillGroup = model.getSkillGroupById(_child.CHILDID);
      skillGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_skillGroup!.originalUUID}`);
    }

    if (_child.CHILDOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_child.CHILDID);
      skillGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

function compareSkillGroup(
  model: IModelManager,
  skillGroup1: SkillGroup,
  skillGroup2: SkillGroup,
  differences: Change[]
) {
  compareESCOEntity(model, skillGroup1, skillGroup2, differences, "skillGroup");

  if (!arrayMatch(skillGroup1.parents, skillGroup2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "skillGroup",
      label: "parents",
      identifier: skillGroup1.row.ID,
      changes: diffArrays(skillGroup1.parents, skillGroup2.parents),
      entity: skillGroup1.originalUUID,
      entityLabel: skillGroup1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: skillGroup1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }
}

export class SkillGroupsService extends ESCOEntityService {
  static compareEntities(modelManager1: IModelManager, modelManager2: IModelManager, differences: Change[]) {
    const model1SkillGroups = modelManager1.state.skillGroups;

    for (const model1SkillGroup of model1SkillGroups) {
      const model2SkillGroup = modelManager2.getSkillGroupByOriginalUUID(model1SkillGroup.originalUUID);
      if (!model2SkillGroup) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "skillGroup",
          identifier: model1SkillGroup.row.ID,
          entity: model1SkillGroup.originalUUID,
          entityLabel: model1SkillGroup.row.PREFERREDLABEL,
          modelId: modelManager1.state.modelId,
          modelName: modelManager1.state.getModelName()
        });
      } else {
        compareSkillGroup(modelManager1, model1SkillGroup, model2SkillGroup, differences);
      }
    }

    const model2SkillGroups = modelManager2.state.skillGroups;
    for (const model2SkillGroup of model2SkillGroups) {
      const model1SkillGroup = modelManager1.getSkillGroupByOriginalUUID(model2SkillGroup.originalUUID);
      if (!model1SkillGroup) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "skillGroup",
          identifier: model2SkillGroup.row.ID,
          entity: model2SkillGroup.originalUUID,
          entityLabel: model2SkillGroup.row.PREFERREDLABEL,
          modelId: modelManager2.state.modelId,
          modelName: modelManager2.state.getModelName()
        });
      }
    }
  }

  async loadFromCSV() {
    const result = await readCSV<ISkillGroupImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.SkillGroups)
    );

    this.modelManager.state.skillGroups = result.rows.map((row) => {
      const result = {
        row,
        ...parseUUIDHistory(row.UUIDHISTORY),
        altLabels: arrayFromString(row.ALTLABELS),
        children: [],
        parents: [],
      };

      this.modelManager.caches.skillGroups.set(result.originalUUID, result);

      return result;
    });
  }

  loadRelations() {
    const skillGroups = this.modelManager.state.skillGroups;

    for (const skillGroup of skillGroups) {
      loadSkillGroup(this.modelManager, skillGroup);
    }

    this.modelManager.state.skillGroups = skillGroups;
  }
}
