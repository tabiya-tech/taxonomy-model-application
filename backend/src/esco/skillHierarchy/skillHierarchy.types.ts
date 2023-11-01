import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";

/**
 * Describes what the ObjectType of the parent of a skills hierarchy is.
 */
export type SkillHierarchyParentType = ObjectTypes.Skill | ObjectTypes.SkillGroup;

/**
 * Describes what the ObjectType of the child of a skills hierarchy is.
 */
export type SkillHierarchyChildType = ObjectTypes.Skill | ObjectTypes.SkillGroup;

/**
 * Describes the type of a skills hierarchy pair.
 */
interface ISkillsHierarchyPairType {
  parentType: SkillHierarchyParentType;
  childType: SkillHierarchyChildType;
}

/**
 * Describes how a skills hierarchy is saved in the database.
 */
export interface ISkillHierarchyPairDoc extends ISkillsHierarchyPairType {
  modelId: mongoose.Types.ObjectId;

  parentId: mongoose.Types.ObjectId;
  parentDocModel: MongooseModelName; // The mongoose model name of the parent. It is used to populate the parent virtual field.

  childId: mongoose.Types.ObjectId;
  childDocModel: MongooseModelName; // The mongoose model name of the child. It is used to populate the child  virtual field.
}

/**
 * Describes how a skills hierarchy is returned from the API.
 */

export interface ISkillHierarchyPair extends Omit<ISkillHierarchyPairDoc, "id" | "modelId" | "parentId" | "childId"> {
  id: string;
  modelId: string;
  parentId: string;
  childId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a new skills hierarchy is created with the API
 */
export type INewSkillHierarchyPairSpec = Pick<ISkillHierarchyPair, "parentId" | "childId"> & ISkillsHierarchyPairType;

/**
 * Describes how a skills hierarchy entry can be populated with references to the parent and child.
 * This is used within repository methods and is not returned from the API.
 */
export interface IPopulatedSkillHierarchyPairDoc extends Omit<ISkillHierarchyPairDoc, "parentId" | "childId"> {
  parentId: ISkillReferenceDoc | ISkillGroupReferenceDoc;
  childId: ISkillReferenceDoc | ISkillGroupReferenceDoc;
}
