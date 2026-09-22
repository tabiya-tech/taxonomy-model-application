import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  TranslatedAltLabelsProperty,
  TranslatedDefinitionProperty,
  TranslatedDescriptionProperty,
  OriginUriProperty,
  ImportIDProperty,
  UUIDHistoryProperty,
  TranslatedPreferredLabelProperty,
  TranslatedScopeNoteProperty,
  EmbeddingStatusProperty,
} from "esco/common/modelSchema";
import { stringRequired } from "server/stringRequired";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillDoc, ISkillTranslatedDoc, ReuseLevel, SkillType } from "../_shared/skill.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";
import { SkillToSkillRelationModelPaths } from "esco/skillToSkillRelation/skillToSkillRelationModel";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { ObjectTypes } from "esco/common/objectTypes";

export const SkillModelPaths = {
  parents: "parents",
  children: "children",
  requiresSkills: "requiresSkills",
  requiredBySkills: "requiredBySkills",
  requiredByOccupations: "requiredByOccupations",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillDoc> {
  // Main Schema
  // Typed against ISkillTranslatedDoc; ISkillDoc (and the Model this function returns) types the translatable
  // fields as flat strings, wrapped/unwrapped by the repository at the fall back language.
  const SkillSchema = new mongoose.Schema<ISkillTranslatedDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      preferredLabel: TranslatedPreferredLabelProperty,
      skillType: {
        type: String,
        required: stringRequired("skillType"),
        enum: SkillType,
      },
      reuseLevel: {
        type: String,
        required: stringRequired("reuseLevel"),
        enum: ReuseLevel,
      },
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      altLabels: TranslatedAltLabelsProperty,
      definition: TranslatedDefinitionProperty,
      description: TranslatedDescriptionProperty,
      scopeNote: TranslatedScopeNoteProperty,
      importId: ImportIDProperty,
      isLocalized: {
        type: Boolean,
        required: true,
      },
      embeddingStatus: EmbeddingStatusProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );
  SkillSchema.virtual(SkillModelPaths.parents, {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: SkillHierarchyModelPaths.childId,
    match: (skill: ISkillTranslatedDoc) => ({ modelId: { $eq: skill.modelId }, childType: { $eq: ObjectTypes.Skill } }),
  });
  SkillSchema.virtual(SkillModelPaths.children, {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: SkillHierarchyModelPaths.parentId,
    match: (skill: ISkillTranslatedDoc) => ({
      modelId: { $eq: skill.modelId },
      parentType: { $eq: ObjectTypes.Skill },
    }),
  });
  SkillSchema.virtual(SkillModelPaths.requiresSkills, {
    ref: MongooseModelName.SkillToSkillRelation,
    localField: "_id",
    foreignField: SkillToSkillRelationModelPaths.requiringSkillId,
    match: (skill: ISkillTranslatedDoc) => ({ modelId: { $eq: skill.modelId } }),
  });
  SkillSchema.virtual(SkillModelPaths.requiredBySkills, {
    ref: MongooseModelName.SkillToSkillRelation,
    localField: "_id",
    foreignField: SkillToSkillRelationModelPaths.requiredSkillId,
    match: (skill: ISkillTranslatedDoc) => ({ modelId: { $eq: skill.modelId } }),
  });
  SkillSchema.virtual(SkillModelPaths.requiredByOccupations, {
    ref: MongooseModelName.OccupationToSkillRelation,
    localField: "_id",
    foreignField: OccupationToSkillRelationModelPaths.requiredSkillId,
    match: (skill: ISkillTranslatedDoc) => ({ modelId: { $eq: skill.modelId } }),
  });
  SkillSchema.index({ UUID: 1 }, { unique: true });
  SkillSchema.index({ modelId: 1 });
  SkillSchema.index({ UUIDHistory: 1 });
  // Model
  return dbConnection.model<ISkillTranslatedDoc>(
    MongooseModelName.Skill,
    SkillSchema
  ) as unknown as mongoose.Model<ISkillDoc>;
}
