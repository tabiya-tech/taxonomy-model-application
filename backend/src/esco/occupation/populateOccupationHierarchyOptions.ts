import mongoose from "mongoose";
import { getISCOGroupDocReference, ISCOGroupDocument } from "esco/iscoGroup/ISCOGroupReference";
import { getOccupationDocReference, OccupationDocument } from "./occupationReference";
import { IISCOGroupReference, IISCOGroupReferenceDoc } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationReference, IOccupationReferenceDoc } from "./occupation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  getOccupationHierarchyChildReference,
  getOccupationHierarchyParentReference,
} from "esco/occupationHierarchy/populateFunctions";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationParentOptions = {
  path: "parent",
  populate: {
    path: "parentId",
    transform: function (
      doc: ModelConstructed & (ISCOGroupDocument | OccupationDocument)
    ): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.ISCOGroup) {
        return getISCOGroupDocReference(doc as ISCOGroupDocument); // NOSONAR
      }
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc as OccupationDocument); // NOSONAR
      }
      console.error(`Parent is not an ISCOGroup or an Occupation: ${modelName}`);
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IISCOGroupReference | IOccupationReference | null {
    return getOccupationHierarchyParentReference(doc) as IISCOGroupReference | IOccupationReference;
  },
};

export const populateOccupationChildrenOptions = {
  path: "children",
  populate: {
    path: "childId",
    transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc);
      }
      console.error(`Child is not an Occupation: ${modelName}`);
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IOccupationReference | null {
    return getOccupationHierarchyChildReference(doc) as IOccupationReference;
  },
};
