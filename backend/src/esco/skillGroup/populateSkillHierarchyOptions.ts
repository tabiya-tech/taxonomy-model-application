import mongoose from "mongoose";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillDocReference, SkillDocument } from "esco/skill/skillReference";
import { getSkillGroupDocReference, SkillGroupDocument } from "esco/skillGroup/skillGroupReference";
import {
  getSkillHierarchyChildrenReference,
  getSkillHierarchyParentsReference,
} from "esco/skillHierarchy/populateFunctions";
import { SkillGroupModelPaths } from "./skillGroupModel";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillGroupParentsOptions = {
  path: SkillGroupModelPaths.parents,
  populate: {
    path: SkillHierarchyModelPaths.parentId,
    transform: function (doc: ModelConstructed & SkillGroupDocument): ISkillGroupReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.SkillGroup) {
        return getSkillGroupDocReference(doc);
      }
      console.error(new Error(`Parent is not a SkillGroup: ${modelName}`));
      return null;
    },
  },
  transform: getSkillHierarchyParentsReference,
};

export const populateSkillGroupChildrenOptions = {
  path: SkillGroupModelPaths.children,
  populate: {
    path: SkillHierarchyModelPaths.childId,
    transform: function (
      doc: ModelConstructed & (SkillDocument | SkillGroupDocument)
    ): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc as SkillDocument); // NOSONAR
      }
      if (modelName === MongooseModelName.SkillGroup) {
        return getSkillGroupDocReference(doc as SkillGroupDocument); // NOSONAR
      }
      // @ts-ignore
      console.error(new Error(`Child is not a SkillGroup or Skill: ${modelName}`));
      return null;
    },
  },
  transform: getSkillHierarchyChildrenReference,
};
