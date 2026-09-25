import mongoose from "mongoose";
import {
  TranslatedAltLabelsProperty,
  TranslatedDescriptionProperty,
  OriginUriProperty,
  OccupationGroupCodeProperty,
  UUIDHistoryProperty,
  TranslatedPreferredLabelProperty,
  EmbeddingStatusProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationGroupDoc } from "../_shared/OccupationGroup.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { RegExp_UUIDv4 } from "server/regex";
import { ObjectTypes } from "esco/common/objectTypes";

export const OccupationGroupModelPaths = {
  parent: "parent",
  children: "children",
  groupType: "groupType",
  code: "code",
};

export const IMPORT_ID_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupationGroupDoc> {
  // Main Schema
  const OccupationGroupSchema = new mongoose.Schema<IOccupationGroupDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      UUIDHistory: UUIDHistoryProperty,
      [OccupationGroupModelPaths.code]: OccupationGroupCodeProperty,
      preferredLabel: TranslatedPreferredLabelProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      originUri: OriginUriProperty,
      altLabels: TranslatedAltLabelsProperty,
      description: TranslatedDescriptionProperty,
      [OccupationGroupModelPaths.groupType]: {
        type: String,
        required: true,
        enum: [ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup],
      },
      importId: {
        type: String,
        required: false,
        maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
      },
      embeddingStatus: EmbeddingStatusProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );
  OccupationGroupSchema.virtual(OccupationGroupModelPaths.parent, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.childId,
    match: (occupationGroup: IOccupationGroupDoc) => ({
      modelId: { $eq: occupationGroup.modelId },
      childType: { $eq: occupationGroup.groupType },
    }),
    justOne: true,
  });

  OccupationGroupSchema.virtual(OccupationGroupModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (occupationGroup: IOccupationGroupDoc) => ({
      modelId: { $eq: occupationGroup.modelId },
      parentType: { $eq: occupationGroup.groupType },
    }),
  });

  // Two occupation groups cannot have the same isco code in the same model
  // Compound index allows to search for the model
  OccupationGroupSchema.index({ modelId: 1, code: 1 }, { unique: true });

  OccupationGroupSchema.index({ UUID: 1 }, { unique: true });
  OccupationGroupSchema.index({ UUIDHistory: 1 });
  // Preferred label must be unique in the same model
  // OccupationGroupSchema.index({preferredLabel: 1, modelId: 1}, {unique: true});

  return dbConnection.model<IOccupationGroupDoc>(MongooseModelName.OccupationGroup, OccupationGroupSchema);
}

import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { readFallbackLanguageValue, readFallbackLanguageValues } from "common/language/translatedFields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  ret.preferredLabel = readFallbackLanguageValue(ret.preferredLabel, fallbackDbKeyName);
  ret.description = readFallbackLanguageValue(ret.description, fallbackDbKeyName);
  ret.altLabels = readFallbackLanguageValues(ret.altLabels, fallbackDbKeyName);
  return ret;
};
