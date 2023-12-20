import mongoose from "mongoose";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
  ISCOCodeProperty,
  UUIDHistoryProperty,
  PreferredLabelProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IISCOGroupDoc } from "./ISCOGroup.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { RegExp_UUIDv4 } from "server/regex";
import { ObjectTypes } from "esco/common/objectTypes";

export const ISCOGroupModelPaths = {
  parent: "parent",
  children: "children",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IISCOGroupDoc> {
  // Main Schema
  const ISCOGroupSchema = new mongoose.Schema<IISCOGroupDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      UUIDHistory: UUIDHistoryProperty,
      code: ISCOCodeProperty,
      preferredLabel: PreferredLabelProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    match: (iscoGroup: IISCOGroupDoc) => ({
      modelId: { $eq: iscoGroup.modelId },
      childType: { $eq: ObjectTypes.ISCOGroup },
    }),
    justOne: true,
  });

  ISCOGroupSchema.virtual(ISCOGroupModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (iscoGroup: IISCOGroupDoc) => ({
      modelId: { $eq: iscoGroup.modelId },
      parentType: { $eq: ObjectTypes.ISCOGroup },
    }),
  });

  // Two isco groups cannot have the same isco code in the same model
  // Compound index allows to search for the model
  ISCOGroupSchema.index(INDEX_FOR_CODE, { unique: true });

  // Two isco groups cannot have the same UUID
  ISCOGroupSchema.index(INDEX_FOR_UUID, { unique: true });
  // Index used to improve queries performance
  ISCOGroupSchema.index(INDEX_FOR_UUIDHistory);

  return dbConnection.model<IISCOGroupDoc>(MongooseModelName.ISCOGroup, ISCOGroupSchema);
}

export const INDEX_FOR_CODE: mongoose.IndexDefinition = { modelId: 1, code: 1 };
export const INDEX_FOR_UUID: mongoose.IndexDefinition = { UUID: 1 };
export const INDEX_FOR_UUIDHistory: mongoose.IndexDefinition = { UUIDHistory: 1 };
