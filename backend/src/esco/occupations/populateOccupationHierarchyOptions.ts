import mongoose from "mongoose";
import { getOccupationGroupDocReference, OccupationGroupDocument } from "esco/occupationGroup/OccupationGroupReference";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/occupationReference";
import { IOccupationGroupReference, IOccupationGroupReferenceDoc } from "esco/occupationGroup/OccupationGroup.types";
import { IOccupationReference, IOccupationReferenceDoc } from "esco/occupations/occupationReference.types";
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
      doc: ModelConstructed & (OccupationGroupDocument | OccupationDocument)
    ): IOccupationGroupReferenceDoc | IOccupationReferenceDoc | null {
      // return only the relevant fields
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.OccupationGroup) {
        return getOccupationGroupDocReference(doc as OccupationGroupDocument); // NOSONAR
      }
      if (modelName === MongooseModelName.Occupation) {
        return getOccupationDocReference(doc as OccupationDocument); // NOSONAR
      }
      console.error(
        new Error(`Parent is not an OccupationGroup or an ESCO Occupation or a Local Occupation: ${modelName}`)
      );
      return null;
    },
  },
  transform: function (
    doc: IPopulatedOccupationHierarchyPairDoc
  ): IOccupationGroupReference | IOccupationReference | null {
    return getOccupationHierarchyParentReference(doc) as IOccupationGroupReference | IOccupationReference;
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
