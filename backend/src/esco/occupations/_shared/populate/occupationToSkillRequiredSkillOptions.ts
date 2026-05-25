import { getSkillDocReference, SkillDocument } from "esco/skill/_shared/skillReference";
import { ISkillReferenceDoc } from "esco/skill/_shared/skill.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import mongoose from "mongoose";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationToSkillRelationRequiredSkill = {
  path: OccupationToSkillRelationModelPaths.requiredSkillId,
  transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
    if (!doc) {
      return null;
    }
    const modelName = (doc as ModelConstructed).constructor.modelName;
    if (modelName === MongooseModelName.Skill) {
      return getSkillDocReference(doc);
    }
    return null;
  },
};
