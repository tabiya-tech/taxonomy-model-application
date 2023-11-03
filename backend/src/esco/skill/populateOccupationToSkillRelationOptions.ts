import { MongooseModelName } from "esco/common/mongooseModelNames";
import mongoose from "mongoose";
import { getOccupationDocReference, OccupationDocument } from "esco/occupation/occupationReference";
import { IOccupationReferenceDoc } from "esco/occupation/occupation.types";
import { getSkillRequiredByOccupationReference } from "esco/occupationToSkillRelation/populateFunctions";
import { SkillModelPaths } from "./skillModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillRequiredByOccupationOptions = {
  path: SkillModelPaths.requiredByOccupations,
  populate: {
    path: OccupationToSkillRelationModelPaths.requiringOccupationId,
    transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc);
      }
      console.error(`Object is not an Occupation: ${modelName}`);
      return null;
    },
  },
  transform: getSkillRequiredByOccupationReference,
};
