import mongoose from "mongoose";
import { ISkillReferenceDoc } from "esco/skill/_shared/skill.types";
import { ISkillGroupReferenceDoc } from "./skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillDocReference, SkillDocument } from "esco/skill/_shared/skillReference";
import { getSkillGroupDocReference, SkillGroupDocument } from "./skillGroupReference";
import {
  getSkillHierarchyChildrenReference,
  getSkillHierarchyParentsReference,
} from "esco/skillHierarchy/populateFunctions";
import { SkillGroupModelPaths } from "../model/SkillGroup.model";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

/**
 * The populate options of the parents of a skill group, their references resolved to the given language
 * (the fall back language when absent).
 */
export function populateSkillGroupParentsOptions(language?: string) {
  return {
    path: SkillGroupModelPaths.parents,
    populate: {
      path: SkillHierarchyModelPaths.parentId,
      transform: function (doc: ModelConstructed & SkillGroupDocument): ISkillGroupReferenceDoc | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.SkillGroup) {
          return getSkillGroupDocReference(doc, language);
        }
        console.error(`Parent is not a SkillGroup: ${modelName}`);
        return null;
      },
    },
    transform: getSkillHierarchyParentsReference,
  };
}

/**
 * The populate options of the children of a skill group, their references resolved to the given language
 * (the fall back language when absent).
 */
export function populateSkillGroupChildrenOptions(language?: string) {
  return {
    path: SkillGroupModelPaths.children,
    populate: {
      path: SkillHierarchyModelPaths.childId,
      transform: function (
        doc: ModelConstructed & (SkillDocument | SkillGroupDocument)
      ): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.Skill) {
          return getSkillDocReference(doc as SkillDocument, language); // NOSONAR
        }
        if (modelName === MongooseModelName.SkillGroup) {
          return getSkillGroupDocReference(doc as SkillGroupDocument, language); // NOSONAR
        }
        // @ts-ignore
        console.error(`Child is not a SkillGroup or Skill: ${modelName}`);
        return null;
      },
    },
    transform: getSkillHierarchyChildrenReference,
  };
}
