import path from "path";

import { Change, ChangeType, ESCOEntityService, OccupationGroup } from "./types";
import { FILENAMES } from "export/async/modelToS3";
import { arrayMatch, compareESCOEntity, parseUUIDHistory, readCSV } from "./common";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationGroupImportRow } from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { IModelManager } from "../model/types";
import { diffArrays } from "diff";

function compareOccupationGroup(
  model: IModelManager,
  occupationGroup1: OccupationGroup,
  occupationGroup2: OccupationGroup,
  differences: Change[]
) {
  compareESCOEntity(model, occupationGroup1, occupationGroup2, differences, "occupationGroup");

  if (!arrayMatch(occupationGroup1.parents, occupationGroup2.parents)) {
    differences.push({
      type: ChangeType.NOT_EQUAL,
      entityType: "occupationGroup",
      label: "parents",
      identifier: occupationGroup1.row.CODE,
      changes: diffArrays(occupationGroup1.parents, occupationGroup2.parents),
      entity: occupationGroup1.originalUUID,
      entityLabel: occupationGroup1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
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
      entityLabel: occupationGroup1.row.PREFERREDLABEL,
      modelId: model.state.modelId,
      modelName: model.state.getModelName()
    });
  }
}

export class OccupationGroupsService extends ESCOEntityService {
  static compareEntities(modelManager1: IModelManager, modelManager2: IModelManager, differences: Change[]) {
    const model1OccupationGroups = modelManager1.state.occupationGroups;

    for (const model1OccupationGroup of model1OccupationGroups) {
      const model2OccupationGroup = modelManager2.getOccupationGroupByOriginalUUID(model1OccupationGroup.originalUUID);
      if (!model2OccupationGroup) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "occupationGroup",
          identifier: model1OccupationGroup.row.CODE,
          entity: model1OccupationGroup.originalUUID,
          entityLabel: model1OccupationGroup.row.PREFERREDLABEL,
          modelId: modelManager1.state.modelId,
          modelName: modelManager1.state.getModelName()
        });
      } else {
        compareOccupationGroup(modelManager1, model1OccupationGroup, model2OccupationGroup, differences);
      }
    }

    const model2OccupationGroups = modelManager2.state.occupationGroups;
    for (const model2OccupationGroup of model2OccupationGroups) {
      const model1OccupationGroup = modelManager1.getOccupationGroupByOriginalUUID(model2OccupationGroup.originalUUID);
      if (!model1OccupationGroup) {
        differences.push({
          type: ChangeType.MISSING,
          entityType: "occupationGroup",
          identifier: model2OccupationGroup.row.CODE,
          entity: model2OccupationGroup.originalUUID,
          entityLabel: model2OccupationGroup.row.PREFERREDLABEL,
          modelId: modelManager2.state.modelId,
          modelName: modelManager2.state.getModelName()
        });
      } else {
        compareESCOEntity(modelManager2, model2OccupationGroup, model1OccupationGroup, differences, "occupationGroup");
      }
    }
  }

  async loadFromCSV(): Promise<void> {
    const result = await readCSV<IOccupationGroupImportRow>(
      path.join(this.modelManager.state.modelPath, FILENAMES.OccupationGroups)
    );

    this.modelManager.state.occupationGroups = result.rows.map((row) => {
      const result = {
        row,
        ...parseUUIDHistory(row.UUIDHISTORY),
        altLabels: arrayFromString(row.ALTLABELS),
        parents: [],
        children: [],
      };

      this.modelManager.caches.occupationGroups.set(result.originalUUID, result);

      return result;
    });
  }

  loadRelations() {
    const occupationGroups = this.modelManager.state.occupationGroups;
    for (const occupationGroup of occupationGroups) {
      // Add parents
      const parents = this.modelManager.getOccupationParentByOccupationId(occupationGroup.row.ID);
      for (const _parent of parents) {
        if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_parent.PARENTOBJECTTYPE)) {
          const _occupationGroup = this.modelManager.getOccupationGroupById(_parent.PARENTID);
          occupationGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupationGroup!.originalUUID}`);
        }
      }

      // Add children
      const children = this.modelManager.getOccupationChildrenByOccupationId(occupationGroup.row.ID);
      for (const _child of children) {
        if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_child.CHILDOBJECTTYPE)) {
          const _occupationGroup = this.modelManager.getOccupationGroupById(_child.CHILDID);
          occupationGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupationGroup!.originalUUID}`);
        }

        if ([ObjectTypes.LocalOccupation, ObjectTypes.ESCOOccupation].includes(_child.PARENTOBJECTTYPE)) {
          const _occupation = this.modelManager.getOccupationById(_child.CHILDID);
          occupationGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
        }
      }
    }

    this.modelManager.state.occupationGroups = occupationGroups;
  }
}
