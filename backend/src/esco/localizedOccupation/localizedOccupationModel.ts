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
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({ modelId: localizedOccupation.modelId }),
    justOne: true,
  });
  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "localizesOccupationId",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({ modelId: localizedOccupation.modelId }),
  });
  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.requiresSkills, {
    ref: MongooseModelName.OccupationToSkillRelation,
    localField: "_id",
    foreignField: OccupationToSkillRelationModelPaths.requiringOccupationId,
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({ modelId: localizedOccupation.modelId }),
  });
  LocalizedOccupationSchema.virtual(LocalizedOccupationModelPaths.localizesOccupation, {
    ref: MongooseModelName.Occupation,
    localField: "localizesOccupationId",
    foreignField: "_id",
    match: (localizedOccupation: ILocalizedOccupationDoc) => ({ modelId: localizedOccupation.modelId }),
    justOne: true,
  });

  LocalizedOccupationSchema.index({ UUID: 1 }, { unique: true });
  LocalizedOccupationSchema.index({ modelId: 1, localizesOccupationId: 1 }, { unique: true });
  LocalizedOccupationSchema.index({ UUIDHistory: 1 });

  // Model
  return dbConnection.model<ILocalizedOccupationDoc>(MongooseModelName.LocalizedOccupation, LocalizedOccupationSchema);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.localizesOccupationId = ret.localizesOccupationId.toString(); // Convert localizesOccupationId to string
  return ret;
};
