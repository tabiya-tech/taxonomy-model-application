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
import { SkillModelPaths } from "./skillModel";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillParentsOptions = {
  path: SkillModelPaths.parents,
  populate: {
    path: SkillHierarchyModelPaths.parentId,
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
      console.error(`Parent is not a Skill or SkillGroup: ${modelName}`);
      return null;
    },
  },
  transform: getSkillHierarchyParentsReference,
};

export const populateSkillChildrenOptions = {
  path: SkillModelPaths.children,
  populate: {
    path: SkillHierarchyModelPaths.childId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(`Child is not a Skill: ${modelName}`);
      return null;
    },
  },
  transform: getSkillHierarchyChildrenReference,
};
