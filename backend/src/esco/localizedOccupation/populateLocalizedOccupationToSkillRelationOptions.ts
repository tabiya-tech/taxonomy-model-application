import { LocalizedOccupationModelPaths } from "esco/common/modelPopulationPaths";
import mongoose from "mongoose";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { getSkillDocReference, SkillDocument } from "esco/skill/skillReference";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getOccupationRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateLocalizedOccupationRequiresSkillsOptions = {
  path: LocalizedOccupationModelPaths.requiresSkills,
  populate: {
    path: OccupationToSkillRelationModelPaths.requiredSkillId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(`Object is not a Skill: ${modelName}`);
      return null;
    },
  },
  transform: getOccupationRequiresSkillReference,
};
