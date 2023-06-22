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
import {MongooseModelName} from "esco/common/mongooseModelNames";
import {IOccupationDoc} from "./occupation.types";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupationDoc> {
  // Main Schema
  const OccupationSchema = new mongoose.Schema<IOccupationDoc>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true},
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    code: ESCOOccupationCodeProperty, // TODO: code should be the .X.Y.Z part of the ESCO code. Esco Code should be the combined as a virtual or a getter
    ISCOGroupCode: ISCOCodeProperty,
    preferredLabel: PreferredLabelProperty,
    altLabels: AltLabelsProperty,
    definition: DefinitionProperty,
    description: DescriptionProperty,
    regulatedProfessionNote: RegulatedProfessionNoteProperty,
    scopeNote: ScopeNoteProperty,
  }, {timestamps: true, strict: "throw"},);
  OccupationSchema.virtual('parent', {
    ref: "OccupationHierarchyModel",
    localField: '_id',
    foreignField: 'childId',
    match: (occupation: IOccupationDoc) => ({modelId: occupation.modelId}),
    justOne: true,
  });
  OccupationSchema.virtual('children', {
    ref: "OccupationHierarchyModel",
    localField: '_id',
    foreignField: 'parentId',
    match: (occupation: IOccupationDoc) => ({modelId: occupation.modelId}),
  });
  OccupationSchema.index({UUID: 1}, {unique: true});
  OccupationSchema.index({code: 1, modelId: 1}, {unique: true});
  OccupationSchema.index({modelId: 1});

  // Model
  return dbConnection.model<IOccupationDoc>(MongooseModelName.Occupation, OccupationSchema);
}