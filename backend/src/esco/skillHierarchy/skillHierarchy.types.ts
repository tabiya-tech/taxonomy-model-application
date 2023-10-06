import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IHierarchyPairSpec } from "esco/common/hierarchy";

export type SkillHierarchyParentType = ObjectTypes.Skill | ObjectTypes.SkillGroup;
export type SkillHierarchyChildType = ObjectTypes.Skill | ObjectTypes.SkillGroup;

interface ISkillsHierarchyPairType {
  parentType: SkillHierarchyParentType;
  childType: SkillHierarchyChildType;
}

export interface ISkillHierarchyPairDoc extends ISkillsHierarchyPairType {
  modelId: string | mongoose.Types.ObjectId;

  parentId: string | mongoose.Types.ObjectId;
  parentDocModel: MongooseModelName; // The mongoose model name of the parent. It is used to populate the parent virtual field.

  childId: string | mongoose.Types.ObjectId;
  childDocModel: MongooseModelName; // The mongoose model name of the child. It is used to populate the child  virtual field.

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISkillHierarchyPair extends ISkillHierarchyPairDoc {
  id: string;
  modelId: string;
  parentId: string;
  childId: string;
}

export type INewSkillHierarchyPairSpec = ISkillsHierarchyPairType & IHierarchyPairSpec;
