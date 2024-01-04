import { OccupationModelPaths } from "esco/common/modelPopulationPaths";
import { OccupationDocument } from "esco/occupation/occupationReference";
import mongoose from "mongoose";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationLocalizedOptions = {
  path: OccupationModelPaths.localized,
  transform: (doc: ModelConstructed & OccupationDocument) => {
    //@ts-ignore
    delete doc.modelId;
    return doc;
  },
};
