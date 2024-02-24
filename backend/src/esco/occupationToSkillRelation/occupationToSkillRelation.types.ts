import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { IOccupationReferenceDoc } from "esco/occupations/occupationReference.types";

/**
 * Describes how an Occupation to skill relation is saved in the database.
 */
export interface IOccupationToSkillRelationPairDoc {
  modelId: mongoose.Types.ObjectId;

  requiringOccupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  requiringOccupationId: mongoose.Types.ObjectId;
  requiringOccupationDocModel: MongooseModelName.Occupation;

  requiredSkillId: mongoose.Types.ObjectId;
  requiredSkillDocModel: MongooseModelName.Skill;

  relationType: RelationType;
}

/**
 * Describes how an occupation to skills relation is returned from the API.
 */
export interface IOccupationToSkillRelationPair
  extends Omit<IOccupationToSkillRelationPairDoc, "id" | "modelId" | "requiringOccupationId" | "requiredSkillId"> {
  id: string;
  modelId: string;
  requiringOccupationId: string;
  requiredSkillId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 *  Describes how an occupation to skills relation is created with the API
 */
export type INewOccupationToSkillPairSpec = Pick<
  IOccupationToSkillRelationPair,
  "requiringOccupationType" | "requiringOccupationId" | "requiredSkillId" | "relationType"
>;

/**
 * Describes how an occupation to skills relation entry can be populated with references to the related skills.
 * This is used within repository methods and is not returned from the API.
 */
export interface IPopulatedOccupationToSkillRelationPairDoc
  extends Omit<IOccupationToSkillRelationPairDoc, "requiringOccupationId" | "requiredSkillId"> {
  requiringOccupationId: IOccupationReferenceDoc;
  requiredSkillId: ISkillReferenceDoc;
}
