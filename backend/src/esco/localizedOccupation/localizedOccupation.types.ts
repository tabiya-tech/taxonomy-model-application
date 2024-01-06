import { ImportIdentifiable, OccupationType } from "esco/common/objectTypes";
import mongoose from "mongoose";
import {ISkillReference} from "esco/skill/skills.types";

/**
 * Describes how a Localized occupation is saved in MongoDB
 */
export interface ILocalizedOccupationDoc extends ImportIdentifiable {
  UUID: string;
  UUIDHistory: string[];
  modelId: mongoose.Types.ObjectId;
  altLabels: string[];
  description: string;
  occupationType: OccupationType;
  localizesOccupationId: mongoose.Types.ObjectId;
}

/**
 * Describes how a localized occupation would be returned from the API.
 */

export interface ILocalizedOccupation extends Omit<ILocalizedOccupationDoc, "localizesOccupationId" | "modelId"> {
  id: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
  occupationType: OccupationType;
  localizesOccupationId: string;
  requiresSkills: ISkillReference[];
}

/**
 *  Describes how new localized occupations are created in the API
 */
export type INewLocalizedOccupationSpec = Omit<ILocalizedOccupation, "id" | "UUID" | "requiresSkills" | "createdAt" | "updatedAt">;
