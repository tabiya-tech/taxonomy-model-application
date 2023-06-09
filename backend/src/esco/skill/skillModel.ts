import mongoose from 'mongoose';
import {RegExp_UUIDv4} from "server/regex";
import {
  AltLabelsProperty, DefinitionProperty,
  DescriptionProperty,
  ESCOUriProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty
} from "esco/common/modelSchema";
import {stringRequired} from "server/stringRequired";

export const ModelName = "SkillModel";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkill> {
  // Main Schema
  const SkillSchema = new mongoose.Schema<ISkill>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    preferredLabel: PreferredLabelProperty,
    skillType: {
      type: String,
      required: stringRequired('skillType'),
      enum: ['skill/competence', 'knowledge', 'language', 'attitude', ''],
    },
    reuseLevel: {
      type: String,
      required: stringRequired('reuseLevel'),
      enum: ['sector-specific', 'occupation-specific', 'cross-sector', 'transversal', '']
    },
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true},
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    altLabels: AltLabelsProperty,
    definition: DefinitionProperty,
    description: DescriptionProperty,
    scopeNote: ScopeNoteProperty,
  }, {timestamps: true, strict: "throw"},);
  SkillSchema.index({UUID: 1}, {unique: true});
  SkillSchema.index({modelId: 1});

  // Model
  return dbConnection.model<ISkill>(ModelName, SkillSchema);
}

export type SkillType = "" | "skill/competence" | "knowledge" | "language" | "attitude";
export type ReuseLevel = "" | "sector-specific" | "occupation-specific" | "cross-sector" | "transversal";

export interface ISkill {
  id: string
  UUID: string
  modelId: string | mongoose.Schema.Types.ObjectId
  preferredLabel: string
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  definition: string
  scopeNote: string
  skillType: SkillType
  reuseLevel: ReuseLevel
  createdAt: Date
  updatedAt: Date
}

export type INewSkillSpec = Omit<ISkill, "id" | "UUID" | "createdAt" | "updatedAt">;
