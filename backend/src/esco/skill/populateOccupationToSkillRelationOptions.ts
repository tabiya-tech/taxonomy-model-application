import { MongooseModelName } from "esco/common/mongooseModelNames";
import mongoose from "mongoose";
import { getOccupationDocReference, OccupationDocument } from "esco/occupation/occupationReference";
import { IOccupationReferenceDoc } from "esco/occupation/occupation.types";
import { getSkillRequiredByOccupationReference } from "esco/occupationToSkillRelation/populateFunctions";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateSkillRequiredByOccupationOptions = {
  path: "requiredByOccupations",
  populate: {
    path: "requiringOccupationId",
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
