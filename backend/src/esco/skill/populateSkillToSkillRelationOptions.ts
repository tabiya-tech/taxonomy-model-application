import { getSkillDocReference, SkillDocument } from "./skillReference";
import { ISkillReferenceDoc } from "./skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  getSkillRequiredBySkillsReference,
  getSkillRequiresSkillsReference,
} from "esco/skillToSkillRelation/populateFunctions";
import mongoose from "mongoose";
import { SkillModelPaths } from "./skillModel";
import { SkillToSkillRelationModelPaths } from "esco/skillToSkillRelation/skillToSkillRelationModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillRequiresSkillsOptions = {
  path: SkillModelPaths.requiresSkills,
  populate: {
    path: SkillToSkillRelationModelPaths.requiredSkillId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(`Object is not a Skill: ${modelName}`);
      return null;
    },
  },
  transform: getSkillRequiresSkillsReference,
};

export const populateSkillRequiredBySkillsOptions = {
  path: SkillModelPaths.requiredBySkills,
  populate: {
    path: SkillToSkillRelationModelPaths.requiringSkillId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(`Object is not a Skill: ${modelName}`);
      return null;
    },
  },
  transform: getSkillRequiredBySkillsReference,
};
