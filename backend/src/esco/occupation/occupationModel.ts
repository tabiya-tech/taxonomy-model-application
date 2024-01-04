import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DefinitionProperty,
  DescriptionProperty,
  OriginUriProperty,
  ImportIDProperty,
  ISCOCodeProperty,
  OccupationCodeProperty,
  OccupationTypeProperty,
  UUIDHistoryProperty,
  PreferredLabelProperty,
  RegulatedProfessionNoteProperty,
  ScopeNoteProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationDoc } from "./occupation.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { LocalizedOccupationModelPaths, OccupationModelPaths } from "esco/common/modelPopulationPaths";
import { ObjectTypes } from "esco/common/objectTypes";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupationDoc> {
  // Main Schema
  const OccupationSchema = new mongoose.Schema<IOccupationDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      code: OccupationCodeProperty, // TODO: code should be the .X.Y.Z part of the ESCO code. Esco Code should be the combined as a virtual or a getter
      ISCOGroupCode: ISCOCodeProperty,
      preferredLabel: PreferredLabelProperty,
      altLabels: AltLabelsProperty,
      definition: DefinitionProperty,
      description: DescriptionProperty,
      regulatedProfessionNote: RegulatedProfessionNoteProperty,
      scopeNote: ScopeNoteProperty,
      importId: ImportIDProperty,
      occupationType: OccupationTypeProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );

  OccupationSchema.virtual(OccupationModelPaths.parent, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.childId,
    match: (occupation: IOccupationDoc) => ({
      modelId: { $eq: occupation.modelId },
      childType: { $eq: ObjectTypes.Occupation },
    }),
    justOne: true,
  });

  OccupationSchema.virtual(OccupationModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (occupation: IOccupationDoc) => ({
      modelId: { $eq: occupation.modelId },
      parentType: { $eq: ObjectTypes.Occupation },
    }),
  });

  OccupationSchema.virtual(OccupationModelPaths.requiresSkills, {
    ref: MongooseModelName.OccupationToSkillRelation,
    localField: "_id",
    foreignField: OccupationToSkillRelationModelPaths.requiringOccupationId,
    match: (occupation: IOccupationDoc) => ({
      modelId: { $eq: occupation.modelId },
      requiringOccupationType: { $eq: occupation.occupationType },
    }),
  });

  OccupationSchema.virtual(OccupationModelPaths.localized, {
    ref: MongooseModelName.LocalizedOccupation,
    localField: "_id",
    foreignField: LocalizedOccupationModelPaths.localizesOccupationId,
    justOne: true,
    match: (occupation: IOccupationDoc) => ({
      modelId: { $eq: occupation.modelId },
    }),
  });

  OccupationSchema.index({ UUID: 1 }, { unique: true });
  OccupationSchema.index({ code: 1, modelId: 1 }, { unique: true });
  OccupationSchema.index({ modelId: 1 });
  OccupationSchema.index({ UUIDHistory: 1 });

  // Model
  return dbConnection.model<IOccupationDoc>(MongooseModelName.Occupation, OccupationSchema);
}
