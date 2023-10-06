import { ImportIdentifiable, ObjectTypes } from "esco//common/objectTypes";
import mongoose from "mongoose";
import { IOccupationReference } from "esco/occupation/occupation.types";

export interface IISCOGroupDoc extends ImportIdentifiable {
  id: string | mongoose.Types.ObjectId;
  modelId: string | mongoose.Types.ObjectId;
  UUID: string;
  originUUID: string;
  code: string;
  ESCOUri: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IISCOGroupReferenceDoc
  extends Pick<IISCOGroupDoc, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.ISCOGroup;
}

export interface IISCOGroup extends IISCOGroupDoc {
  id: string;
  modelId: string;
  parent: IISCOGroupReference | null;
  children: (IISCOGroupReference | IOccupationReference)[];
}

export type INewISCOGroupSpec = Omit<
  IISCOGroup,
  "id" | "UUID" | "parent" | "children" | "createdAt" | "updatedAt"
>;

export interface IISCOGroupReference
  extends Pick<IISCOGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.ISCOGroup;
}
