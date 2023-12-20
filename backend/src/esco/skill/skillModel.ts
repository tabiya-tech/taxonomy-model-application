import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DefinitionProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
  UUIDHistoryProperty,
  PreferredLabelProperty,
  ScopeNoteProperty,
} from "esco/common/modelSchema";
import { stringRequired } from "server/stringRequired";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillDoc, ReuseLevel, SkillType } from "./skills.types";
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
  const SkillSchema = new mongoose.Schema<ISkillDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      preferredLabel: PreferredLabelProperty,
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
      ESCOUri: ESCOUriProperty,
      altLabels: AltLabelsProperty,
      definition: DefinitionProperty,
      description: DescriptionProperty,
      scopeNote: ScopeNoteProperty,
      importId: ImportIDProperty,
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
    match: (skill: ISkillDoc) => ({ modelId: { $eq: skill.modelId }, childType: { $eq: ObjectTypes.Skill } }),
  });
  SkillSchema.virtual(SkillModelPaths.children, {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: SkillHierarchyModelPaths.parentId,
    match: (skill: ISkillDoc) => ({ modelId: { $eq: skill.modelId }, parentType: { $eq: ObjectTypes.Skill } }),
  });
  SkillSchema.virtual(SkillModelPaths.requiresSkills, {
    ref: MongooseModelName.SkillToSkillRelation,
    localField: "_id",
    foreignField: SkillToSkillRelationModelPaths.requiringSkillId,
    match: (skill: ISkillDoc) => ({ modelId: { $eq: skill.modelId } }),
  });
  SkillSchema.virtual(SkillModelPaths.requiredBySkills, {
    ref: MongooseModelName.SkillToSkillRelation,
    localField: "_id",
    foreignField: SkillToSkillRelationModelPaths.requiredSkillId,
    match: (skill: ISkillDoc) => ({ modelId: { $eq: skill.modelId } }),
  });
  SkillSchema.virtual(SkillModelPaths.requiredByOccupations, {
    ref: MongooseModelName.OccupationToSkillRelation,
    localField: "_id",
    foreignField: OccupationToSkillRelationModelPaths.requiredSkillId,
    match: (skill: ISkillDoc) => ({ modelId: { $eq: skill.modelId } }),
  });

  // Two instances cannot have the same UUID
  SkillSchema.index(INDEX_FOR_UUID, { unique: true });

  // Index used to improve queries performance
  SkillSchema.index(INDEX_FOR_MODEL_ID);
  SkillSchema.index(INDEX_FOR_UUIDHistory);
  // Model
  return dbConnection.model<ISkillDoc>(MongooseModelName.Skill, SkillSchema);
}

export const INDEX_FOR_MODEL_ID: mongoose.IndexDefinition = { modelId: 1 };
export const INDEX_FOR_UUID: mongoose.IndexDefinition = { UUID: 1 };
export const INDEX_FOR_UUIDHistory: mongoose.IndexDefinition = { UUIDHistory: 1 };
