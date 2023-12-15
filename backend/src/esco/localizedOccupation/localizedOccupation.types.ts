import { ImportIdentifiable, OccupationType, ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillReference } from "esco/skill/skills.types";
import mongoose from "mongoose";
import { IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupation, IOccupationReference } from "esco/occupation/occupation.types";

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
 * Describes a version of the localized occupation that includes the occupation it localizes
 */

export interface ILocalizedOccupation extends Omit<ILocalizedOccupationDoc, "localizesOccupationId" | "modelId"> {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | IOccupationReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
  occupationType: OccupationType;
  localizesOccupation: IOccupation;
  requiresSkills: ReferenceWithRelationType<ISkillReference>[];
}

/**
 * Describes how localized occupations are finally return from the API
 */
export interface IExtendedLocalizedOccupation extends Omit<ILocalizedOccupation, "localizesOccupation">, IOccupation {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | IOccupationReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
  occupationType: OccupationType;
  localizesOccupationId: string;
  localizedOccupationType: OccupationType;
  requiresSkills: ReferenceWithRelationType<ISkillReference>[];
}

/**
 *  Describes how new localized occupations are created in the API
 */
export interface INewLocalizedOccupationSpec
  extends Omit<
    ILocalizedOccupation,
    "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt" | "localizesOccupation"
  > {
  localizesOccupationId: string;
}
