import { MongooseModelName } from "esco/common/mongooseModelNames";
import mongoose from "mongoose";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/_shared/occupation.reference";
import { getRequiredByOccupationReference } from "esco/occupationToSkillRelation/populateFunctions";
import { SkillModelPaths } from "../model/skill.model";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export function makePopulateSkillRequiredByOccupationOptions(language: string) {
  return {
    path: SkillModelPaths.requiredByOccupations,
    populate: {
      path: OccupationToSkillRelationModelPaths.requiringOccupationId,
      transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReference | null {
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName !== MongooseModelName.Occupation) {
          console.error(`Object is not an Occupation: ${modelName}`);
          return null;
        }
        return getOccupationDocReference(doc, language);
      },
    },
    transform: getRequiredByOccupationReference,
  };
}

// Backward-compatible fallback-language factory for write paths.
export function populateSkillRequiredByOccupationOptions() {
  return makePopulateSkillRequiredByOccupationOptions(getFallbackLanguageConfig().dbKeyName);
}
