import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { IOccupationGroupReference } from "esco/occupationGroup/OccupationGroup.types";
import { ISkillReference } from "esco/skill/skills.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

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
 * Describes how an OccupationGroup is created with the API without import action.
 */
export type INewOccupationSpecWithoutImportId = Omit<INewOccupationSpec, "importId">;

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;
