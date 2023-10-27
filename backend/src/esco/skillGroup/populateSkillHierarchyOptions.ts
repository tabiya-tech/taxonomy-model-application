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

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillGroupParentsOptions = {
  path: "parents",
  populate: {
    path: "parentId",
    transform: function (doc: ModelConstructed & SkillGroupDocument): ISkillGroupReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.SkillGroup) {
        return getSkillGroupDocReference(doc);
      }
      console.error(`Parent is not a SkillGroup: ${modelName}`);
      return null;
    },
  },
  transform: getSkillHierarchyParentsReference,
};

export const populateSkillGroupChildrenOptions = {
  path: "children",
  populate: {
    path: "childId",
    transform: function (
      doc: ModelConstructed & (SkillDocument | SkillGroupDocument)
    ): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc as SkillDocument);
      }
      if (modelName === MongooseModelName.SkillGroup) {
        return getSkillGroupDocReference(doc as SkillGroupDocument);
      }
      // @ts-ignore
      console.error(`Child is not a SkillGroup or Skill: ${modelName}`);
      return null;
    },
  },
  transform: getSkillHierarchyChildrenReference,
};
