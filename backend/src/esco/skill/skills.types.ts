import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes, ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillGroupReference } from "esco/skillGroup/skillGroup.types";

//TODO: Eventually this will have to move to the api definition.
export enum SkillType {
  None = "",
  SkillCompetence = "skill/competence",
  Knowledge = "knowledge",
  Language = "language",
  Attitude = "attitude",
}

export enum ReuseLevel {
  None = "",
  SectorSpecific = "sector-specific",
  OccupationSpecific = "occupation-specific",
  CrossSector = "cross-sector",
  Transversal = "transversal",
}

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
  requiresSkills: ReferenceWithRelationType<ISkillReferenceDoc>[];
  requiredBySkills: ReferenceWithRelationType<ISkillReferenceDoc>[];
}

export type INewSkillSpec = Omit<
  ISkill,
  "id" | "UUID" | "parents" | "children" | "requiresSkills" | "requiredBySkills" | "createdAt" | "updatedAt"
>;

export interface ISkillReference extends Pick<ISkill, "id" | "UUID" | "preferredLabel"> {
  objectType: ObjectTypes.Skill;
}
