import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  TranslatedAltLabelsProperty,
  TranslatedDefinitionProperty,
  TranslatedDescriptionProperty,
  OccupationCodeProperty,
  OriginUriProperty,
  TranslatedPreferredLabelProperty,
  TranslatedRegulatedProfessionNoteProperty,
  TranslatedScopeNoteProperty,
  UUIDHistoryProperty,
  OccupationGroupCodeProperty,
  EmbeddingStatusProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationDoc } from "../_shared/occupation.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { OccupationHierarchyModelPaths } from "esco/occupationHierarchy/occupationHierarchyModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { readFallbackLanguageValue, readFallbackLanguageValues } from "common/language/translatedFields";

export const OccupationModelPaths = {
  parent: "parent",
  children: "children",
  requiresSkills: "requiresSkills",
  occupationType: "occupationType",
  code: "code",
};
export const IMPORT_ID_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IOccupationDoc> {
  // Main Schema
  const OccupationSchema = new mongoose.Schema<IOccupationDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      [OccupationModelPaths.code]: OccupationCodeProperty, // TODO: code should be the .X.Y.Z part of the ESCO code. Esco Code should be the combined as a virtual or a getter
      occupationGroupCode: OccupationGroupCodeProperty, // TODO: if OccupationGroupCode is part of the code, then make sure that code starts with the OccupationGroupCode (e.g. I32_0_1 starts with I32)
      preferredLabel: TranslatedPreferredLabelProperty,
      altLabels: TranslatedAltLabelsProperty,
      definition: TranslatedDefinitionProperty,
      description: TranslatedDescriptionProperty,
      regulatedProfessionNote: TranslatedRegulatedProfessionNoteProperty,
      scopeNote: TranslatedScopeNoteProperty,
      [OccupationModelPaths.occupationType]: {
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
      importId: {
        type: String,
        required: false,
        maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
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
      embeddingStatus: EmbeddingStatusProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  const fallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;
  ret.preferredLabel = readFallbackLanguageValue(ret.preferredLabel, fallbackDbKeyName);
  ret.description = readFallbackLanguageValue(ret.description, fallbackDbKeyName);
  ret.definition = readFallbackLanguageValue(ret.definition, fallbackDbKeyName);
  ret.scopeNote = readFallbackLanguageValue(ret.scopeNote, fallbackDbKeyName);
  ret.regulatedProfessionNote = readFallbackLanguageValue(ret.regulatedProfessionNote, fallbackDbKeyName);
  ret.altLabels = readFallbackLanguageValues(ret.altLabels, fallbackDbKeyName);
  return ret;
};
