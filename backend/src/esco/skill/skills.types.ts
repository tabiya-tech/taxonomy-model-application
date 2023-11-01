import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes, ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillGroupReference } from "esco/skillGroup/skillGroup.types";

/**
 * Enum for the different types of skills.
 */
export enum SkillType {
  None = "",
  SkillCompetence = "skill/competence",
  Knowledge = "knowledge",
  Language = "language",
  Attitude = "attitude",
}

/**
 * Enum for the different levels of reuse for skills.
 */
export enum ReuseLevel {
  None = "",
  SectorSpecific = "sector-specific",
  OccupationSpecific = "occupation-specific",
  CrossSector = "cross-sector",
  Transversal = "transversal",
}

/**
 * Describes how a skill is saved in the database.
 */
export interface ISkillDoc extends ImportIdentifiable {
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: string;
  originUUID: string;
  ESCOUri: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  skillType: SkillType;
  reuseLevel: ReuseLevel;
}

/**
 * Describes how a skill is returned from the API.
 */
export interface ISkill extends Omit<ISkillDoc, "modelId"> {
  id: string;
  modelId: string;
  parents: (ISkillReference | ISkillGroupReference)[];
  children: (ISkillReference | ISkillGroupReference)[];
  requiresSkills: ReferenceWithRelationType<ISkillReference>[];
  requiredBySkills: ReferenceWithRelationType<ISkillReference>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new skill is created with the API.
 */
export type INewSkillSpec = Omit<
  ISkill,
  "id" | "UUID" | "parents" | "children" | "requiresSkills" | "requiredBySkills" | "createdAt" | "updatedAt"
>;

/**
 * Describes how a reference to a skill is returned from the API
 */
export interface ISkillReference extends Pick<ISkill, "id" | "UUID" | "preferredLabel"> {
  objectType: ObjectTypes.Skill;
}

/**
 * Describes how a reference to a skill is populated within repository functions.
 * This is not returned from the API.
 */
export interface ISkillReferenceDoc extends Pick<ISkillDoc, "modelId" | "UUID" | "preferredLabel"> {
  id: string;
  objectType: ObjectTypes.Skill;
}
