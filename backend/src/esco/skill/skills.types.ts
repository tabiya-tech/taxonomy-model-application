import mongoose from "mongoose";
import { ImportIdentifiable } from "esco/common/objectTypes";

export type SkillType = "" | "skill/competence" | "knowledge" | "language" | "attitude";
export type ReuseLevel = "" | "sector-specific" | "occupation-specific" | "cross-sector" | "transversal";

export interface ISkillDoc extends ImportIdentifiable {
  UUID: string;
  modelId: string | mongoose.Types.ObjectId;
  preferredLabel: string;
  originUUID: string;
  ESCOUri: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  skillType: SkillType;
  reuseLevel: ReuseLevel;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISkill extends ISkillDoc {
  id: string;
  modelId: string;
}

export type INewSkillSpec = Omit<ISkill, "id" | "UUID" | "createdAt" | "updatedAt">;
