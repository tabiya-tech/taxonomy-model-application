import mongoose from "mongoose";

export interface ISkillGroupDoc {
  UUID: string
  code: string
  preferredLabel: string
  modelId: string | mongoose.Types.ObjectId
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  scopeNote: string
  parentGroups: string[] | mongoose.Types.ObjectId[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ISkillGroup {
  id: string
  UUID: string
  code: string
  preferredLabel: string
  modelId: string
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  scopeNote: string
  parentGroups: ISkillGroupReference[]
  childrenGroups: ISkillGroupReference[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ISkillGroupReference {
  id: string
  UUID: string
  code: string
  preferredLabel: string
}

export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parentGroups" | "childrenGroups" | "createdAt" | "updatedAt">;

