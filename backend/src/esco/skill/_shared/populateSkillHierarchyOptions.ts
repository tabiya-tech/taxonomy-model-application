import mongoose from "mongoose";
import { ISkillReferenceDoc } from "esco/skill/_shared/skill.types";
import { ISkillGroupReferenceDoc } from "esco/skillGroup/_shared/skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillDocReference, SkillDocument } from "esco/skill/_shared/skillReference";
import { getSkillGroupDocReference, SkillGroupDocument } from "esco/skillGroup/_shared/skillGroupReference";
import {
  getSkillHierarchyChildrenReference,
  getSkillHierarchyParentsReference,
} from "esco/skillHierarchy/populateFunctions";
import { SkillModelPaths } from "../model/skill.model";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export function makePopulateSkillParentsOptions(language: string) {
  return {
    path: SkillModelPaths.parents,
    populate: {
      path: SkillHierarchyModelPaths.parentId,
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
        console.error(`Parent is not a Skill or SkillGroup: ${modelName}`);
        return null;
      },
    },
    transform: getSkillHierarchyParentsReference,
  };
}

export function makePopulateSkillChildrenOptions(language: string) {
  return {
    path: SkillModelPaths.children,
    populate: {
      path: SkillHierarchyModelPaths.childId,
      transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.Skill) {
          return getSkillDocReference(doc, language);
        }
        console.error(`Child is not a Skill: ${modelName}`);
        return null;
      },
    },
    transform: getSkillHierarchyChildrenReference,
  };
}

// Backward-compatible fallback-language factories for write paths.
export function populateSkillParentsOptions() {
  return makePopulateSkillParentsOptions(getFallbackLanguageConfig().dbKeyName);
}
export function populateSkillChildrenOptions() {
  return makePopulateSkillChildrenOptions(getFallbackLanguageConfig().dbKeyName);
}
