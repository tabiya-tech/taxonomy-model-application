import { MongooseModelName } from "esco/common/mongooseModelNames";
import mongoose from "mongoose";
import { getOccupationRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { getSkillDocReference, SkillDocument } from "esco/skill/skillReference";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationRequiresSkillsOptions = {
  path: "requiresSkills",
  populate: {
    path: "requiredSkillId",
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
