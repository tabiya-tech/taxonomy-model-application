import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "server/regex";
import {
  AltLabelsProperty, DescriptionProperty,
  ESCOUriProperty, ISCOCodeProperty,
  OriginUUIDProperty,
  PreferredLabelProperty
} from "esco/common/modelSchema";

export const ModelName = "ISCOGroupModel";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IISCOGroup> {

  // Main Schema
  const ISCOGroupSchema = new mongoose.Schema<IISCOGroup>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4}, // TODO this could be an nodejs UUID
    ISCOCode: ISCOCodeProperty,
    preferredLabel: PreferredLabelProperty,
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true}, // TODO this should be an ObjectId
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    altLabels: AltLabelsProperty,
    description: DescriptionProperty,
    parentGroup: {type: mongoose.Schema.Types.ObjectId, ref: ModelName},
  }, {
    timestamps: true, strict: "throw"
  });

  ISCOGroupSchema.virtual(
    'childrenGroups', {
      localField: '_id',
      foreignField: 'parentGroup',
      ref: ModelName
    }
  );

  ISCOGroupSchema.index({UUID: 1}, {unique: true});

  ISCOGroupSchema.index({modelId: 1});

  // Two isco groups cannot have the same isco code in the same model
  ISCOGroupSchema.index({ISCOCode: 1, modelId: 1}, {unique: true});
  // Preferred label must be unique in the same model
  // ISCOGroupSchema.index({preferredLabel: 1, modelId: 1}, {unique: true});

  return dbConnection.model<IISCOGroup>(ModelName, ISCOGroupSchema);
}

export interface IISCOGroupReference {
  id: string
  UUID: string
  ISCOCode: string
  preferredLabel: string
}

export interface IISCOGroup {
  id: string
  modelId: string | mongoose.Types.ObjectId
  UUID: string
  originUUID: string
  ISCOCode: string
  ESCOUri: string
  preferredLabel: string
  altLabels: string[]
  description: string
  parentGroup: string | mongoose.Types.ObjectId | IISCOGroupReference | null | undefined
  childrenGroups: string[] | mongoose.Types.ObjectId[] | IISCOGroupReference[]
  createdAt: Date,
  updatedAt: Date
}

export type INewISCOGroupSpec = Omit<IISCOGroup, "id" | "UUID" | "parentGroup" | "childrenGroups" | "createdAt" | "updatedAt">;

