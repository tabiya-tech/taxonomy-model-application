import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationReferenceDoc } from "esco/occupations/occupationReference.types";
import { IOccupationGroupReferenceDoc } from "esco/occupationGroup/OccupationGroup.types";

/**
 * Describes what the ObjectType of the parent of an occupation hierarchy is.
 */
export type OccupationHierarchyParentType =
  | ObjectTypes.ISCOGroup
  | ObjectTypes.LocalGroup
  | ObjectTypes.ESCOOccupation
  | ObjectTypes.LocalOccupation;

/**
 * Describes what the ObjectType of the child of an occupation hierarchy is.
 */
export type OccupationHierarchyChildType =
  | ObjectTypes.ISCOGroup
  | ObjectTypes.LocalGroup
  | ObjectTypes.ESCOOccupation
  | ObjectTypes.LocalOccupation;

/**
 * Describes the type of an occupation hierarchy pair.
 */
interface IOccupationHierarchyPairType {
  parentType: OccupationHierarchyParentType;
  childType: OccupationHierarchyChildType;
}

/**
 * Describes how an occupation hierarchy is saved in the database.
 */
export interface IOccupationHierarchyPairDoc extends IOccupationHierarchyPairType {
  modelId: mongoose.Types.ObjectId;

  parentId: mongoose.Types.ObjectId;
  parentDocModel: MongooseModelName; // The mongoose model name of the parent. It is used to populate the parent virtual field.

  childId: mongoose.Types.ObjectId;
  childDocModel: MongooseModelName; // The mongoose model name of the child. It is used to populate the child virtual field.
}

/**
 * Describes how an occupation hierarchy is returned from the API.
 */
export interface IOccupationHierarchyPair
  extends Omit<IOccupationHierarchyPairDoc, "id" | "modelId" | "parentId" | "childId"> {
  id: string;
  modelId: string;
  parentId: string;
  childId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new occupation hierarchy is created with the API.
 */
export type INewOccupationHierarchyPairSpec = Pick<IOccupationHierarchyPair, "parentId" | "childId"> &
  IOccupationHierarchyPairType;

/**
 * Describes how an occupation hierarchy entry can be populated with references to the parent and child.
 * This is used within repository methods and is not returned from the API.
 */
export interface IPopulatedOccupationHierarchyPairDoc
  extends Omit<IOccupationHierarchyPairDoc, "parentId" | "childId"> {
  parentId: IOccupationReferenceDoc | IOccupationGroupReferenceDoc;
  childId: IOccupationReferenceDoc | IOccupationGroupReferenceDoc;
}
