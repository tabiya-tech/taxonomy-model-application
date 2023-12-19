import { ImportIdentifiable, ObjectTypes, OccupationType, ReferenceWithRelationType } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { ISkillReference } from "esco/skill/skills.types";

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
  occupationType: OccupationType;
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

/**
 * Describes how a reference to an occupation is returned from the API
 */
export interface IOccupationReference
  extends Pick<IOccupation, "id" | "UUID" | "ISCOGroupCode" | "code" | "preferredLabel" | "occupationType"> {
  objectType: ObjectTypes.Occupation;
}

/**
 * Describes how a reference to an occupation is populated within repository functions.
 * This is not returned from the API.
 */
export interface IOccupationReferenceDoc
  extends Pick<IOccupationDoc, "modelId" | "UUID" | "ISCOGroupCode" | "code" | "preferredLabel" | "occupationType"> {
  id: string;
  objectType: ObjectTypes.Occupation;
}
