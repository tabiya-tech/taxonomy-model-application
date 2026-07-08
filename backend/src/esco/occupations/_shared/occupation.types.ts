import { ImportIdentifiable, ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { IOccupationGroupReference } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ISkill, ISkillReference } from "esco/skill/_shared/skill.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

/**
 * Describes a skill with its relationship metadata to an occupation.
 */
export interface ISkillWithRelation extends ISkill {
  relationType: OccupationToSkillRelationType;
  signallingValue: number | null;
  signallingValueLabel: SignallingValueLabel;
}

/**
 * Describes an occupation with its relationship metadata to a skill.
 */
export interface IOccupationWithRelation extends IOccupation {
  relationType: OccupationToSkillRelationType;
  signallingValue: number | null;
  signallingValueLabel: SignallingValueLabel;
}

/**
 * Describes how an occupation is saved in MongoDB
 */
export interface IOccupationDoc extends ImportIdentifiable {
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: string;
  UUIDHistory: string[];
  originUri: string;
  occupationGroupCode: string;
  code: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  regulatedProfessionNote: string;
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  isLocalized: boolean;
  importId: string;
}

/**
 * Describes how occupations are return from the API
 */
export interface IOccupation extends Omit<IOccupationDoc, "modelId"> {
  id: string;
  modelId: string;
  parent: IOccupationGroupReference | IOccupationReference | null;
  children: (IOccupationGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
  requiresSkills: OccupationToSkillReferenceWithRelationType<ISkillReference>[];
}

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;

/**
 * Describes how an OccupationGroup is created with the API without import action.
 */
export type INewOccupationSpecWithoutImportId = Omit<INewOccupationSpec, "importId">;

export interface IOccupationWithoutImportId extends Omit<IOccupation, "importId"> {
  importId: string | null;
}

/**
 * Describes the mutable fields for a full occupation replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parent, children, requiresSkills, createdAt, updatedAt.
 */
export type IUpdateOccupationSpec = Pick<
  IOccupation,
  | "code"
  | "occupationGroupCode"
  | "preferredLabel"
  | "originUri"
  | "altLabels"
  | "definition"
  | "description"
  | "regulatedProfessionNote"
  | "scopeNote"
  | "modelId"
  | "occupationType"
  | "UUIDHistory"
  | "isLocalized"
>;

/**
 * Describes the mutable fields for a partial occupation update (PATCH).
 * All fields are optional.
 */
export type IPartialUpdateOccupationSpec = Partial<IUpdateOccupationSpec>;
