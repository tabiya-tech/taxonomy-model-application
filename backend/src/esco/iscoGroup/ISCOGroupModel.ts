import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
  ISCOCodeProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IISCOGroupDoc } from "./ISCOGroup.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";

export const ISCOGroupModelPaths = {
  parent: "parent",
  children: "children",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IISCOGroupDoc> {
  // Main Schema
  const ISCOGroupSchema = new mongoose.Schema<IISCOGroupDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      code: ISCOCodeProperty,
      preferredLabel: PreferredLabelProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      originUUID: OriginUUIDProperty,
      ESCOUri: ESCOUriProperty,
      altLabels: AltLabelsProperty,
      description: DescriptionProperty,
      importId: ImportIDProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );
  ISCOGroupSchema.virtual(ISCOGroupModelPaths.parent, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.childId,
    match: (iscoGroup: IISCOGroupDoc) => ({ modelId: iscoGroup.modelId }),
    justOne: true,
  });
  ISCOGroupSchema.virtual(ISCOGroupModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (iscoGroup: IISCOGroupDoc) => ({ modelId: iscoGroup.modelId }),
  });

  ISCOGroupSchema.index({ UUID: 1 }, { unique: true });

  ISCOGroupSchema.index({ modelId: 1 });

  // Two isco groups cannot have the same isco code in the same model
  ISCOGroupSchema.index({ code: 1, modelId: 1 }, { unique: true });

  return dbConnection.model<IISCOGroupDoc>(MongooseModelName.ISCOGroup, ISCOGroupSchema);
}
