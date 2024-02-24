import { ImportIdentifiable, ObjectTypes, ReferenceWithRelationType } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { ISkillReference } from "esco/skill/skills.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";

/**
 * Describes how an occupation is saved in MongoDB
 */
export interface IOccupationDoc extends ImportIdentifiable {
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: string;
  UUIDHistory: string[];
  originUri: string;
  ISCOGroupCode: string;
  code: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  regulatedProfessionNote: string;
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  isLocalized: boolean;
}

/**
 * Describes how occupations are return from the API
 */
export interface IOccupation extends Omit<IOccupationDoc, "modelId"> {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | IOccupationReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
  requiresSkills: ReferenceWithRelationType<ISkillReference>[];
}

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;
