import { getSkillDocReference, SkillDocument } from "../_shared/skillReference";
import { ISkillReferenceDoc } from "../_shared/skill.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  getSkillRequiredBySkillsReference,
  getSkillRequiresSkillsReference,
} from "esco/skillToSkillRelation/populateFunctions";
import mongoose from "mongoose";
import { SkillModelPaths } from "../model/skill.model";
import { SkillToSkillRelationModelPaths } from "esco/skillToSkillRelation/skillToSkillRelationModel";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export function makePopulateSkillRequiresSkillsOptions(language: string) {
  return {
    path: SkillModelPaths.requiresSkills,
    populate: {
      path: SkillToSkillRelationModelPaths.requiredSkillId,
      transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.Skill) {
          return getSkillDocReference(doc, language);
        }
        console.error(`Object is not a Skill: ${modelName}`);
        return null;
      },
    },
    transform: getSkillRequiresSkillsReference,
  };
}

export function makePopulateSkillRequiredBySkillsOptions(language: string) {
  return {
    path: SkillModelPaths.requiredBySkills,
    populate: {
      path: SkillToSkillRelationModelPaths.requiringSkillId,
      transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.Skill) {
          return getSkillDocReference(doc, language);
        }
        console.error(`Object is not a Skill: ${modelName}`);
        return null;
      },
    },
    transform: getSkillRequiredBySkillsReference,
  };
}

// Backward-compatible fallback-language factories for write paths.
export function populateSkillRequiresSkillsOptions() {
  return makePopulateSkillRequiresSkillsOptions(getFallbackLanguageConfig().dbKeyName);
}
export function populateSkillRequiredBySkillsOptions() {
  return makePopulateSkillRequiredBySkillsOptions(getFallbackLanguageConfig().dbKeyName);
}
