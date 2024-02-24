import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DefinitionProperty,
  DescriptionProperty,
  ImportIDProperty,
  ISCOCodeProperty,
  OccupationCodeProperty,
  OriginUriProperty,
  PreferredLabelProperty,
  RegulatedProfessionNoteProperty,
  ScopeNoteProperty,
  UUIDHistoryProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationDoc } from "./occupation.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { ObjectTypes } from "esco/common/objectTypes";

export const OccupationModelPaths = {
  parent: "parent",
  children: "children",
  requiresSkills: "requiresSkills",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupationDoc> {
  // Main Schema
  const OccupationSchema = new mongoose.Schema<IOccupationDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      code: OccupationCodeProperty, // TODO: code should be the .X.Y.Z part of the ESCO code. Esco Code should be the combined as a virtual or a getter
      ISCOGroupCode: ISCOCodeProperty, // TODO: if code ISCOGroupCode is part of the code then make sure that code starts with ISCOGroupCode
      preferredLabel: PreferredLabelProperty,
      altLabels: AltLabelsProperty,
      definition: DefinitionProperty,
      description: DescriptionProperty,
      regulatedProfessionNote: RegulatedProfessionNoteProperty,
      scopeNote: ScopeNoteProperty,
      importId: ImportIDProperty,
      occupationType: {
        type: String,
        required: true,
        enum: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation],
        validate: {
          validator: function (value: ObjectTypes) {
            // @ts-ignore
            if (value === ObjectTypes.LocalOccupation && this.isLocalized) {
              throw new Error(
                "Value of `occupationType` is not compatible with value of `isLocalized`. Local occupations cannot be localised"
              );
            }
          },
        },
      },
      isLocalized: {
        type: Boolean,
        required: true,
        validate: {
          validator: function (value: boolean) {
            // @ts-ignore
            if (value && this.occupationType === ObjectTypes.LocalOccupation) {
              throw new Error(
                "Value of `isLocalized` is not compatible with value of `occupationType`. Local occupations cannot be localised"
              );
            }
          },
        },
      },
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
      childType: { $eq: occupation.occupationType },
    }),
    justOne: true,
  });

  OccupationSchema.virtual(OccupationModelPaths.children, {
    ref: MongooseModelName.OccupationHierarchy,
    localField: "_id",
    foreignField: OccupationHierarchyModelPaths.parentId,
    match: (occupation: IOccupationDoc) => ({
      modelId: { $eq: occupation.modelId },
      parentType: { $eq: occupation.occupationType },
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

  OccupationSchema.index(INDEX_FOR_UUID, { unique: true });
  OccupationSchema.index(INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE);
  OccupationSchema.index(INDEX_FOR_UNIQUE_CODE, { unique: true });
  OccupationSchema.index(INDEX_FOR_UUID_HISTORY);

  // Model
  return dbConnection.model<IOccupationDoc>(MongooseModelName.Occupation, OccupationSchema);
}

export const INDEX_FOR_FIND_MODEL_OCCUPATION_TYPE: mongoose.IndexDefinition = {
  modelId: 1,
  occupationType: 1,
};

export const INDEX_FOR_UNIQUE_CODE: mongoose.IndexDefinition = {
  modelId: 1,
  code: 1,
};
export const INDEX_FOR_UUID: mongoose.IndexDefinition = {
  UUID: 1,
};
export const INDEX_FOR_UUID_HISTORY: mongoose.IndexDefinition = {
  UUIDHistory: 1,
};
