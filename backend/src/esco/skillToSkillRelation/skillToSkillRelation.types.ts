import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { RelationType } from "esco/common/objectTypes";

export interface ISkillToSkillRelationPairDoc {
  modelId: string | mongoose.Types.ObjectId;

  requiringSkillId: string | mongoose.Types.ObjectId;
  requiringSkillDocModel: MongooseModelName;

  requiredSkillId: string | mongoose.Types.ObjectId;
  requiredSkillDocModel: MongooseModelName;
  relationType: RelationType;

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ISkillToSkillRelationPair extends ISkillToSkillRelationPairDoc {
  id: string;
  modelId: string;
  requiringSkillId: string;
  requiredSkillId: string;
}

export type INewSkillToSkillPairSpec = {
  relationType: RelationType;
  requiringSkillId: string;
  requiredSkillId: string;
};
