import {LocalizedOccupationModelPaths, OccupationModelPaths} from "esco/common/modelPopulationPaths";
import {OccupationDocument} from "esco/occupation/occupationReference";
import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { getSkillDocReference, SkillDocument } from "esco/skill/skillReference";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationLocalizedOptions = {
  path: OccupationModelPaths.localized,
  populate: {
    path: LocalizedOccupationModelPaths.requiresSkills, // populate the requiresSkills for the localized occupation internally
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(new Error(`Child is not a Skill: ${modelName}`));
      return null;
    },
  },
  transform: (doc: ModelConstructed & OccupationDocument) => {
    //@ts-ignore
    delete doc.modelId;
    return doc;
  },
};
