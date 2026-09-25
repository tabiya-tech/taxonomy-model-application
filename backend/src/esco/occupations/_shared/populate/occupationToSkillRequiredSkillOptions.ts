import { getSkillDocReference, SkillDocument } from "esco/skill/_shared/skillReference";
import { ISkillReferenceDoc } from "esco/skill/_shared/skill.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import mongoose from "mongoose";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export function makePopulateOccupationToSkillRelationRequiredSkill(language: string) {
  return {
    path: OccupationToSkillRelationModelPaths.requiredSkillId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      if (!doc) {
        return null;
      }
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc, language);
      }
      return null;
    },
  };
}

// Backward-compatible factory for write paths.
export function populateOccupationToSkillRelationRequiredSkill() {
  return makePopulateOccupationToSkillRelationRequiredSkill(getFallbackLanguageConfig().dbKeyName);
}
