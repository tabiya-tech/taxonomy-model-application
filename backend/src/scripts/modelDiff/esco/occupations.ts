import path from "path";

import { FILENAMES } from "export/async/modelToS3";
import { arrayMatch, compareESCOEntity, parseUUIDHistory, readCSV } from "./common";
import { ObjectTypes } from "esco/common/objectTypes";
import { Change, ChangeType, ESCOEntityService, Occupation } from "./types";
import { IModelManager } from "scripts/modelDiff/model/types";
import { IOccupationImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { diffArrays } from "diff";

function loadOccupation(model: IModelManager, occupation: Occupation) {
  // Add skills
  const relations = model.getOccupationToSKillsRelationsByOccupationId(occupation.row.ID);
  for (const _relation of relations) {
    const skill = model.getSkillById(_relation?.SKILLID);
    occupation.skills.push(
      `${skill!.originalUUID}-${_relation.RELATIONTYPE}-${_relation.SIGNALLINGVALUE}-${_relation.SIGNALLINGVALUELABEL}`
    );
  }

  // Add parents
  const parents = model.getOccupationParentByOccupationId(occupation.row.ID);
  for (const _parent of parents) {
    if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_parent.PARENTOBJECTTYPE)) {
      const occupationGroup = model.getOccupationGroupById(_parent.PARENTID);
      occupation.parents.push(`${_parent.PARENTOBJECTTYPE}@${occupationGroup!.originalUUID}`);
    }

    if ([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation].includes(_parent.PARENTOBJECTTYPE)) {
      const _occupation = model.getOccupationById(_parent.PARENTID);
      occupation.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add childrens.
  const children = model.getOccupationChildrenByOccupationId(occupation.row.ID);
  for (const _child of children) {
    if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_child.CHILDOBJECTTYPE)) {
      const occupationGroup = model.getOccupationGroupById(_child.CHILDID);
      occupation.children.push(`${_child.CHILDOBJECTTYPE}@${occupationGroup!.originalUUID}`);
    }

    if ([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation].includes(_child.CHILDOBJECTTYPE)) {
      const _occupation = model.getOccupationById(_child.CHILDID);
      occupation.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

function compareOccupation(
  model: IModelManager,
  occupation1: Occupation,
  occupation2: Occupation,
  differences: Change[]
) {
  compareESCOEntity(model, occupation1, occupation2, differences, "occupation");

  if (!arrayMatch(occupation1.skills, occupation2.skills)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupation",
      label: "skills",
      identifier: occupation1.row.CODE,
      changes: diffArrays(occupation1.skills, occupation2.skills),
      entity: occupation1.originalUUID,
      entityLabel: occupation1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: occupation1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: occupation1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }
}

export class OccupationService extends ESCOEntityService {
  static compareEntities(modelManager1: IModelManager, modelManager2: IModelManager, differences: Change[]) {
    const model1Occupations = modelManager1.state.occupations;

    for (const model1Occupation of model1Occupations) {
      const model2Occupation = modelManager2.getOccupationByOriginalUUID(model1Occupation.originalUUID);
      if (!model2Occupation) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "occupation",
          identifier: model1Occupation.row.CODE,
          entity: model1Occupation.originalUUID,
          entityLabel: model1Occupation.row.PREFERREDLABEL,
          modelId: modelManager1.state.modelId,
          modelName: modelManager1.state.getModelName()
        });
      } else {
        compareOccupation(modelManager1, model1Occupation, model2Occupation, differences);
      }
    }

    const model2Occupations = modelManager2.state.occupations;
    for (const model2Occupation of model2Occupations) {
      const model1Occupation = modelManager1.getOccupationByOriginalUUID(model2Occupation.originalUUID);
      if (!model1Occupation) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "occupation",
          identifier: model2Occupation.row.CODE,
          entity: model2Occupation.originalUUID,
          entityLabel: model2Occupation.row.PREFERREDLABEL,
          modelId: modelManager2.state.modelId,
          modelName: modelManager2.state.getModelName()
        });
      }
    }
  }

  async loadFromCSV(): Promise<void> {
    const result = await readCSV<IOccupationImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.Occupations)
    );

    this.modelManager.state.occupations = result.rows.map((row) => {
      const result = {
        row,
        ...parseUUIDHistory(row.UUIDHISTORY),
        altLabels: arrayFromString(row.ALTLABELS),
        children: [],
        parents: [],
        skills: [],
      };

      this.modelManager.caches.occupations.set(result.originalUUID, result);
      return result;
    });
  }

  loadRelations() {
    const currentOccupations = this.modelManager.state.occupations;

    for (const occupation of currentOccupations) {
      loadOccupation(this.modelManager, occupation);
    }

    this.modelManager.state.occupations = currentOccupations;
  }
}
