import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroupReference } from "esco/skillGroup/skillGroup.types";

export type SkillType = "" | "skill/competence" | "knowledge" | "language" | "attitude";
export type ReuseLevel = "" | "sector-specific" | "occupation-specific" | "cross-sector" | "transversal";

export interface ISkillDoc extends ImportIdentifiable {
  id: string | mongoose.Types.ObjectId;
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

export interface ISkillReferenceDoc extends Pick<ISkillDoc, "id" | "UUID" | "preferredLabel"> {
  objectType: ObjectTypes.Skill;
}

export interface ISkill extends ISkillDoc {
  id: string;
  modelId: string;
  parents: (ISkillReference | ISkillGroupReference)[];
  children: (ISkillReference | ISkillGroupReference)[];
}

export type INewSkillSpec = Omit<ISkill, "id" | "UUID" | "parents" | "children" | "createdAt" | "updatedAt">;

export interface ISkillReference extends Pick<ISkill, "id" | "UUID" | "preferredLabel"> {
  objectType: ObjectTypes.Skill;
}
