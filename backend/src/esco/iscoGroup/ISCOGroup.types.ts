import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupation/occupation.types";

/**
 * Describes how an ISCOGroup is saved in the database.
 */
export interface IISCOGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  UUIDHistory: string[];
  code: string;
  originUri: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
}

/**
 * Describes how an ISCOGroup is returned from the API.
 */
export interface IISCOGroup extends Omit<IISCOGroupDoc, "id" | "modelId"> {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new ISCOGroup is created with the API.
 */
export type INewISCOGroupSpec = Omit<IISCOGroup, "id" | "UUID" | "parent" | "children" | "createdAt" | "updatedAt">;

/**
 * Describes how a reference to an ISCOGroup is returned from the API.
 */
export interface IISCOGroupReference extends Pick<IISCOGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.ISCOGroup;
}

/**
 * Describes how a reference to an ISCOGroup is populated within repository functions .
 * This is not returned from the API.
 */
export interface IISCOGroupReferenceDoc extends Pick<IISCOGroupDoc, "modelId" | "UUID" | "code" | "preferredLabel"> {
  id: string;
  objectType: ObjectTypes.ISCOGroup;
}
