import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";

/**
 * Describing how the data is saved in MongoDB
 */
export interface IOccupationDoc extends ImportIdentifiable {
  id: string | mongoose.Types.ObjectId;
  UUID: string;
  modelId: string | mongoose.Types.ObjectId;
  preferredLabel: string;
  originUUID: string;
  ESCOUri: string;
  ISCOGroupCode: string;
  code: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  regulatedProfessionNote: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IOccupationReferenceDoc
  extends Pick<IOccupationDoc, "id" | "UUID" | "ISCOGroupCode" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.Occupation;
}

/**
 * Describes how occupations are return from the API
 */
export interface IOccupation extends IOccupationDoc {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | IOccupationReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
}

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<IOccupation, "id" | "UUID" | "parent" | "children" | "createdAt" | "updatedAt">;

/**
 * Describing how references are returned from the API
 */
export interface IOccupationReference
  extends Pick<IOccupation, "id" | "UUID" | "ISCOGroupCode" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.Occupation;
}
