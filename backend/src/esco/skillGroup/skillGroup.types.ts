import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { ISkillReference } from "esco/skill/skills.types";

/**
 * Describes how a skill group is saved in the database.
 */
export interface ISkillGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  UUIDHistory: string[];
  code: string;
  originUri: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  scopeNote: string;
}

/**
 * Describes how a skill group is returned from the API.
 */
export interface ISkillGroup extends Omit<ISkillGroupDoc, "id" | "modelId" | "UUIDHistory"> {
  id: string;
  UUID: string;
  modelId: string;
  parents: ISkillGroupReference[];
  UUIDHistory: string[];
  children: (ISkillGroupReference | ISkillReference)[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISkillGroupWithoutImportId extends Omit<ISkillGroup, "importId"> {
  importId: string | null;
}

/**
 * Describes how a new skill group is created with the API.
 */
export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parents" | "children" | "createdAt" | "updatedAt">;

/**
 * Describes how an SkillGroup is created with the API without import action.
 */
export type INewSkillGroupSpecWithoutImportId = Omit<INewSkillGroupSpec, "importId">;
/**
 * Describes how a reference to a skill group is returned from the API
 */
export interface ISkillGroupReference extends Pick<ISkillGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.SkillGroup | ObjectTypes.Skill;
}

/**
 * Describes how a reference to a skill group is populated within repository functions .
 * This is not returned from the API.
 */
export interface ISkillGroupReferenceDoc extends Pick<ISkillGroupDoc, "modelId" | "UUID" | "code" | "preferredLabel"> {
  id: string;
  objectType: ObjectTypes.SkillGroup | ObjectTypes.Skill;
}

/**
 * These are service level error codes for validating a model for skill group operations
 */
export enum ModelForSkillGroupValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB,
  MODEL_NOT_FOUND_BY_ID,
  MODEL_IS_RELEASED,
}
/**
 * Base path parameters for skill group routes
 */
export type BasePathParams = {
  modelId?: string;
};
