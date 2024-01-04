import { MongooseModelName } from "esco/common/mongooseModelNames";
import mongoose from "mongoose";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/common/occupationReference";
import { getRequiredByOccupationReference } from "esco/occupationToSkillRelation/populateFunctions";
import { SkillModelPaths } from "./skillModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { IOccupationReference } from "esco/occupations/common/occupationReference.types";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillRequiredByOccupationOptions = {
  path: SkillModelPaths.requiredByOccupations,
  populate: {
    path: OccupationToSkillRelationModelPaths.requiringOccupationId,
    transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReference | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName !== MongooseModelName.Occupation) {
        console.error(`Object is not an Occupation: ${modelName}`);
        return null;
      }
      return getOccupationDocReference(doc);
    },
  },
  transform: getRequiredByOccupationReference,
};
