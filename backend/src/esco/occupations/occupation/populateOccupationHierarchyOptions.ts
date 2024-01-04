import mongoose from "mongoose";
import { getISCOGroupDocReference, ISCOGroupDocument } from "esco/iscoGroup/ISCOGroupReference";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/common/occupationReference";
import { IISCOGroupReference, IISCOGroupReferenceDoc } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationReference, IOccupationReferenceDoc } from "esco/occupations/common/occupationReference.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  getOccupationHierarchyChildReference,
  getOccupationHierarchyParentReference,
} from "esco/occupationHierarchy/populateFunctions";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";

import { OccupationModelPaths } from "./occupationModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationParentOptions = {
  path: OccupationModelPaths.parent,
  populate: {
    path: OccupationHierarchyModelPaths.parentId,
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
      console.error(new Error(`Parent is not an ISCOGroup or an ESCO Occupation or a Local Occupation: ${modelName}`));
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IISCOGroupReference | IOccupationReference | null {
    return getOccupationHierarchyParentReference(doc) as IISCOGroupReference | IOccupationReference;
  },
};

export const populateOccupationChildrenOptions = {
  path: OccupationModelPaths.children,
  populate: {
    path: OccupationHierarchyModelPaths.childId,
    transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc);
      }
      console.error(new Error(`Child is not an ESCO Occupation or a Local Occupation: ${modelName}`));
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IOccupationReference | null {
    return getOccupationHierarchyChildReference(doc) as IOccupationReference;
  },
};
