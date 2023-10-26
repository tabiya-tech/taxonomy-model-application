import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { ISkillReference } from "esco/skill/skills.types";

/**
 * Describes how a skill group is saved in the database.
 */
export interface ISkillGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  originUUID: string;
  code: string;
  ESCOUri: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  scopeNote: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a skill group is returned from the API.
 */
export interface ISkillGroup extends Omit<ISkillGroupDoc, "modelId"> {
  id: string;
  modelId: string;
  parents: ISkillGroupReference[];
  children: (ISkillGroupReference | ISkillReference)[];
}

/**
 * Describes how a new skill group is created with the API.
 */
export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parents" | "children" | "createdAt" | "updatedAt">;

/**
 * Describes how a reference to a skill group is returned from the API
 */
export interface ISkillGroupReference extends Pick<ISkillGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.SkillGroup;
}

/**
 * Describes how a reference to a skill group is populated within repository functions .
 * This is not returned from the API.
 */
export interface ISkillGroupReferenceDoc extends Pick<ISkillGroupDoc, "modelId" | "UUID" | "code" | "preferredLabel"> {
  id: string;
  objectType: ObjectTypes.SkillGroup;
}
