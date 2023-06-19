import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "server/regex";
import {
  AltLabelsProperty, DefinitionProperty,
  DescriptionProperty, ESCOOccupationCodeProperty,
  ESCOUriProperty, ISCOCodeProperty,
  OriginUUIDProperty,
  PreferredLabelProperty, RegulatedProfessionNoteProperty,
  ScopeNoteProperty
} from "esco/common/modelSchema";

export const ModelName = "OccupationModel";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupation> {
  // Main Schema
  const OccupationSchema = new mongoose.Schema<IOccupation>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true},
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    code: ESCOOccupationCodeProperty,
    ISCOGroupCode: ISCOCodeProperty,
    preferredLabel: PreferredLabelProperty,
    altLabels: AltLabelsProperty,
    definition: DefinitionProperty,
    description: DescriptionProperty,
    regulatedProfessionNote: RegulatedProfessionNoteProperty,
    scopeNote: ScopeNoteProperty,
  }, {timestamps: true, strict: "throw"},);
  OccupationSchema.index({UUID: 1}, {unique: true});
  OccupationSchema.index({code: 1, modelId: 1}, {unique: true});
  OccupationSchema.index({modelId: 1});

  // Model
  return dbConnection.model<IOccupation>(ModelName, OccupationSchema);
}

export interface IOccupation {
  id: string
  UUID: string
  modelId: string | mongoose.Schema.Types.ObjectId
  preferredLabel: string
  originUUID: string
  ESCOUri: string
  ISCOGroupCode: string
  code: string
  altLabels: string[]
  description: string
  definition: string
  scopeNote: string
  regulatedProfessionNote: string
  createdAt: Date
  updatedAt: Date
}

export type INewOccupationSpec = Omit<IOccupation, "id" | "UUID" | "createdAt" | "updatedAt">;
