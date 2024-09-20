import mongoose from "mongoose";
import { getOccupationGroupDocReference, OccupationGroupDocument } from "esco/occupationGroup/OccupationGroupReference";
import { IOccupationGroupReference, IOccupationGroupReferenceDoc } from "esco/occupationGroup/OccupationGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  getOccupationHierarchyChildReference,
  getOccupationHierarchyParentReference,
} from "esco/occupationHierarchy/populateFunctions";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/occupationReference";
import { IOccupationReference, IOccupationReferenceDoc } from "esco/occupations/occupationReference.types";
import { OccupationGroupModelPaths } from "./OccupationGroupModel";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateOccupationGroupParentOptions = {
  path: OccupationGroupModelPaths.parent,
  populate: {
    path: OccupationHierarchyModelPaths.parentId,
    transform: function (doc: ModelConstructed & OccupationGroupDocument): IOccupationGroupReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.OccupationGroup) {
        return getOccupationGroupDocReference(doc);
      }
      console.error(`Parent is not an OccupationGroup: ${modelName}`);
      return null;
    },
  },
  transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IOccupationGroupReference | null {
    return getOccupationHierarchyParentReference(doc) as IOccupationGroupReference;
  },
};

export const populateOccupationGroupChildrenOptions = {
  path: OccupationGroupModelPaths.children,
  populate: {
    path: OccupationHierarchyModelPaths.childId,
    transform: function (
      doc: ModelConstructed & (OccupationDocument | OccupationGroupDocument)
    ): IOccupationGroupReferenceDoc | IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc as OccupationDocument); // NOSONAR
      }
      if (modelName === MongooseModelName.OccupationGroup) {
        return getOccupationGroupDocReference(doc as OccupationGroupDocument); // NOSONAR
      }
      console.error(`Child is not an OccupationGroup or ESCO Occupation or Local Occupation: ${modelName}`);
      return null;
    },
  },
  transform: function (
    doc: IPopulatedOccupationHierarchyPairDoc
  ): IOccupationGroupReference | IOccupationReference | null {
    return getOccupationHierarchyChildReference(doc) as IOccupationGroupReference | IOccupationReference;
  },
};
