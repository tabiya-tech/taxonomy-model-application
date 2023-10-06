import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";

export interface IOccupationHierarchyPairDoc {
  modelId: string | mongoose.Types.ObjectId;

  parentType: ObjectTypes.ISCOGroup | ObjectTypes.Occupation;
  parentId: string | mongoose.Types.ObjectId;
  parentDocModel: MongooseModelName; // The mongoose model name of the parent. It is used to populate the parent virtual field.

  childId: string | mongoose.Types.ObjectId;
  childType: ObjectTypes.ISCOGroup | ObjectTypes.Occupation;
  childDocModel: MongooseModelName; // The mongoose model name of the child. It is used to populate the child  virtual field.

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IOccupationHierarchyPair {
  id: string;
  modelId: string;

  parentType: ObjectTypes.ISCOGroup | ObjectTypes.Occupation;
  parentId: string;
  parentDocModel: MongooseModelName; // The mongoose model name of the parent. It is used to populate the parent virtual field.

  childId: string;
  childType: ObjectTypes.ISCOGroup | ObjectTypes.Occupation;
  childDocModel: MongooseModelName; // The mongoose model name of the child. It is used to populate the child  virtual field.

  createdAt: Date | string;
  updatedAt: Date | string;
}

export type INewOccupationHierarchyPairSpec = Omit<
  IOccupationHierarchyPair,
  | "id"
  | "modelId"
  | "parentDocModel"
  | "childDocModel"
  | "createdAt"
  | "updatedAt"
>;
