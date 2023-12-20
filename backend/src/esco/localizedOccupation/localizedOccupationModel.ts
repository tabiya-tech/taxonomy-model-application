import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ImportIDProperty,
  OccupationTypeProperty,
  UUIDHistoryProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { ILocalizedOccupationDoc } from "./localizedOccupation.types";

import { LocalizedOccupationModelPaths } from "esco/common/modelPopulationPaths";
import { ObjectTypes, OccupationType } from "esco/common/objectTypes";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ILocalizedOccupationDoc> {
  // Main Schema
  const LocalizedOccupationSchema = new mongoose.Schema<ILocalizedOccupationDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      UUIDHistory: UUIDHistoryProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      altLabels: AltLabelsProperty,
      description: DescriptionProperty,
      importId: ImportIDProperty,
      occupationType: OccupationTypeProperty,
      localizesOccupationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.parent, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "localizesOccupationId",
    foreignField: OccupationHierarchyModelPaths.childId,
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({
      modelId: { $eq: localizedOccupation.modelId },
      childType: { $eq: ObjectTypes.Occupation },
    }),
    justOne: true,
  });

  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "localizesOccupationId",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({
      modelId: { $eq: localizedOccupation.modelId },
      parentType: { $eq: ObjectTypes.Occupation },
    }),
  });

  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.requiresSkills, {
    ref: MongooseModelName.OccupationToSkillRelation,
    localField: "_id",
    foreignField: OccupationToSkillRelationModelPaths.requiringOccupationId,
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({
      modelId: { $eq: localizedOccupation.modelId },
      requiringOccupationType: { $eq: OccupationType.LOCALIZED },
    }),
  });

  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.localizesOccupation, {
    ref: MongooseModelName.Occupation,
    localField: "localizesOccupationId",
    foreignField: "_id",
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({ modelId: { $eq: localizedOccupation.modelId } }),
    justOne: true,
  });

  // Two instances cannot have the same UUID
  LocalizedOccupationSchema.index(INDEX_FOR_UUID, { unique: true });

  // Two instances cannot have the same localizesOccupationId in the same model
  // Compound index allows to search for the model
  LocalizedOccupationSchema.index(INDEX_FOR_LOCALIZES_OCCUPATION_ID, { unique: true });

  // Index used to improve queries performance
  LocalizedOccupationSchema.index(INDEX_FOR_UUIDHistory);

  // Model
  return dbConnection.model<ILocalizedOccupationDoc>(MongooseModelName.LocalizedOccupation, LocalizedOccupationSchema);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.localizesOccupationId = ret.localizesOccupationId.toString(); // Convert localizesOccupationId to string
  return ret;
};

export const INDEX_FOR_UUID: mongoose.IndexDefinition = { UUID: 1 };
export const INDEX_FOR_LOCALIZES_OCCUPATION_ID: mongoose.IndexDefinition = { modelId: 1, localizesOccupationId: 1 };
export const INDEX_FOR_UUIDHistory: mongoose.IndexDefinition = { UUIDHistory: 1 };
