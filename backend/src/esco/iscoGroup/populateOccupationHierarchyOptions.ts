import mongoose from "mongoose";
import { getISCOGroupDocReference, ISCOGroupDocument } from "esco/iscoGroup/ISCOGroupReference";
import { IISCOGroupReference, IISCOGroupReferenceDoc } from "esco/iscoGroup/ISCOGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  getOccupationHierarchyChildReference,
  getOccupationHierarchyParentReference,
} from "esco/occupationHierarchy/populateFunctions";
import { getOccupationDocReference, OccupationDocument } from "esco/occupation/occupationReference";
import { IOccupationReference, IOccupationReferenceDoc } from "esco/occupation/occupation.types";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateISCOGroupParentOptions = {
  path: "parent",
  populate: {
    path: "parentId",
    transform: function (doc: ModelConstructed & ISCOGroupDocument): IISCOGroupReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.ISCOGroup) {
        return getISCOGroupDocReference(doc);
      }
      console.error(`Parent is not an ISCOGroup: ${modelName}`);
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IISCOGroupReference | null {
    return getOccupationHierarchyParentReference(doc) as IISCOGroupReference;
  },
};

export const populateISCOGroupChildrenOptions = {
  path: "children",
  populate: {
    path: "childId",
    transform: function (
      doc: ModelConstructed & (OccupationDocument | ISCOGroupDocument)
    ): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc as OccupationDocument); // NOSONAR
      }
      if (modelName === MongooseModelName.ISCOGroup) {
        return getISCOGroupDocReference(doc as ISCOGroupDocument); // NOSONAR
      }
      console.error(`Child is not an ISCOGroup or Occupation: ${modelName}`);
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IISCOGroupReference | IOccupationReference | null {
    return getOccupationHierarchyChildReference(doc) as IISCOGroupReference | IOccupationReference;
  },
};
