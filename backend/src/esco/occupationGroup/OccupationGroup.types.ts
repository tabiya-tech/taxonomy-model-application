import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupations/occupationReference.types";

/**
 * Describes how an OccupationGroup is saved in the database.
 */
export interface IOccupationGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  UUIDHistory: string[];
  code: string;
  originUri: string;
  preferredLabel: string;
  altLabels: string[];
  groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
  description: string;
}

/**
 * Describes how an OccupationGroup is returned from the API.
 */
export interface IOccupationGroup extends Omit<IOccupationGroupDoc, "id" | "modelId"> {
  id: string;
  modelId: string;
  parent: IOccupationGroupReference | null;
  children: (IOccupationGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new OccupationGroup is created with the API.
 */
export type INewOccupationGroupSpec = Omit<
  IOccupationGroup,
  "id" | "UUID" | "parent" | "children" | "createdAt" | "updatedAt"
>;

/**
 * Describes how a reference to an OccupationGroup is returned from the API.
 */
export interface IOccupationGroupReference extends Pick<IOccupationGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
}

/**
 * Describes how a reference to an OccupationGroup is populated within repository functions .
 * This is not returned from the API.
 */
export interface IOccupationGroupReferenceDoc
  extends Pick<IOccupationGroupDoc, "modelId" | "UUID" | "code" | "preferredLabel"> {
  id: string;
  objectType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
}
