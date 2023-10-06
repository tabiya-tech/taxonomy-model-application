import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { ISkillReference } from "../skill/skills.types";

export interface ISkillGroupDoc extends ImportIdentifiable {
  id: string | mongoose.Types.ObjectId;
  modelId: string | mongoose.Types.ObjectId;
  UUID: string;
  originUUID: string;
  code: string;
  ESCOUri: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  scopeNote: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISkillGroupReferenceDoc extends Pick<ISkillGroupDoc, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.SkillGroup;
}

export interface ISkillGroup extends ISkillGroupDoc {
  id: string;
  modelId: string;
  parents: ISkillGroupReference[];
  children: (ISkillGroupReference | ISkillReference)[];
}

export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parents" | "children" | "createdAt" | "updatedAt">;

export interface ISkillGroupReference extends Pick<ISkillGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.SkillGroup;
}
