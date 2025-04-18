import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillReferenceDoc } from "esco/skill/skills.types";

/**
 * Describes how a skills to skills relation is saved in the database.
 */
export interface ISkillToSkillRelationPairDoc {
  modelId: mongoose.Types.ObjectId;

  requiringSkillId: mongoose.Types.ObjectId;
  requiringSkillDocModel: MongooseModelName;

  requiredSkillId: mongoose.Types.ObjectId;
  requiredSkillDocModel: MongooseModelName;
  relationType: SkillToSkillRelationType;
}

/**
 * Describes how a skills to skills relation is returned from the API.
 */
export interface ISkillToSkillRelationPair
  extends Omit<ISkillToSkillRelationPairDoc, "id" | "modelId" | "requiringSkillId" | "requiredSkillId"> {
  id: string;
  modelId: string;
  requiringSkillId: string;
  requiredSkillId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 *  Describes how a skills to skills relation is created with the API
 */
export type INewSkillToSkillPairSpec = Pick<
  ISkillToSkillRelationPair,
  "requiringSkillId" | "requiredSkillId" | "relationType"
>;

/**
 * Describes how a skills to skills relation entry can be populated with references to the related skills.
 * This is used within repository methods and is not returned from the API.
 */
export interface IPopulatedSkillToSkillRelationPairDoc
  extends Omit<ISkillToSkillRelationPairDoc, "requiringSkillId" | "requiredSkillId"> {
  requiringSkillId: ISkillReferenceDoc;
  requiredSkillId: ISkillReferenceDoc;
}

/**
 * Enum for the two different types of skill to skill relations in the ESCO ontology, essential and optional
 */
export enum SkillToSkillRelationType {
  ESSENTIAL = "essential",
  OPTIONAL = "optional",
}

/**
 * Describes how a skills to skills relation reference is returned from the API.
 */
export type SkillToSkillReferenceWithRelationType<T> = T & {
  relationType: SkillToSkillRelationType;
};
