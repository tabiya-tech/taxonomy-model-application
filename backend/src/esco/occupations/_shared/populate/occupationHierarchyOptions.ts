import mongoose from "mongoose";
import {
  getOccupationGroupDocReference,
  OccupationGroupDocument,
} from "esco/occupationGroup/_shared/OccupationGroupReference";
import { getOccupationDocReference, OccupationDocument } from "esco/occupations/_shared/occupation.reference";
import {
  IOccupationGroupReference,
  IOccupationGroupReferenceDoc,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupationReference, IOccupationReferenceDoc } from "esco/occupations/_shared/occupationReference.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  getOccupationHierarchyChildReference,
  getOccupationHierarchyParentReference,
} from "esco/occupationHierarchy/populateFunctions";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

import { OccupationModelPaths } from "../../model/occupation.model";

type ModelConstructed = { constructor: mongoose.Model<unknown> };

export function makePopulateOccupationParentOptions(language: string) {
  return {
    path: OccupationModelPaths.parent,
    populate: {
      path: OccupationHierarchyModelPaths.parentId,
      transform: function (
        doc: ModelConstructed & (OccupationGroupDocument | OccupationDocument)
      ): IOccupationGroupReferenceDoc | IOccupationReferenceDoc | null {
        if (!doc) {
          return null;
        }
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.OccupationGroup) {
          return getOccupationGroupDocReference(doc as OccupationGroupDocument, language); // NOSONAR
        }
        if (modelName === MongooseModelName.Occupation) {
          return getOccupationDocReference(doc as OccupationDocument, language); // NOSONAR
        }
        return null;
      },
    },
    transform: function (
      doc: IPopulatedOccupationHierarchyPairDoc
    ): IOccupationGroupReference | IOccupationReference | null {
      return getOccupationHierarchyParentReference(doc) as IOccupationGroupReference | IOccupationReference;
    },
  };
}

export function makePopulateOccupationChildrenOptions(language: string) {
  return {
    path: OccupationModelPaths.children,
    populate: {
      path: OccupationHierarchyModelPaths.childId,
      transform: function (doc: ModelConstructed & OccupationDocument): IOccupationReferenceDoc | null {
        if (!doc) {
          return null;
        }
        const modelName = (doc as ModelConstructed).constructor.modelName;
        if (modelName === MongooseModelName.Occupation) {
          return getOccupationDocReference(doc, language);
        }
        return null;
      },
    },
    transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IOccupationReference | null {
      return getOccupationHierarchyChildReference(doc) as IOccupationReference;
    },
  };
}

// Backward-compatible fallback-language factories for write paths.
// Named with the same identifier as the former constants so callers only need to add ()
// and getFallbackLanguageConfig() is not called at module-load time.
export function populateOccupationParentOptions() {
  return makePopulateOccupationParentOptions(getFallbackLanguageConfig().dbKeyName);
}
export function populateOccupationChildrenOptions() {
  return makePopulateOccupationChildrenOptions(getFallbackLanguageConfig().dbKeyName);
}
