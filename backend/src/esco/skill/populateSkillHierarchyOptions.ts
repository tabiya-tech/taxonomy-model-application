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

export const populateSkillParentsOptions = {
  path: "parents",
  populate: {
    path: "parentId",
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
      console.error(`Parent is not a Skill or SkillGroup: ${modelName}`);
      return null;
    },
  },
  transform: getSkillHierarchyParentsReference,
};

export const populateSkillChildrenOptions = {
  path: "children",
  populate: {
    path: "childId",
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
