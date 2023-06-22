import mongoose from "mongoose";

export type SkillType = "" | "skill/competence" | "knowledge" | "language" | "attitude";
export type ReuseLevel = "" | "sector-specific" | "occupation-specific" | "cross-sector" | "transversal";

export interface ISkillDoc {
  UUID: string
  modelId: string | mongoose.Types.ObjectId
  preferredLabel: string
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  definition: string
  scopeNote: string
  skillType: SkillType
  reuseLevel: ReuseLevel
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ISkill {
  id: string
  UUID: string
  modelId: string
  preferredLabel: string
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  definition: string
  scopeNote: string
  skillType: SkillType
  reuseLevel: ReuseLevel
  createdAt: Date | string
  updatedAt: Date | string
}

export type INewSkillSpec = Omit<ISkill, "id" | "UUID" | "createdAt" | "updatedAt">;
