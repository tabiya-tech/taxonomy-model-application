import mongoose from "mongoose";
import { ISkillDoc } from "esco/skill/skills.types";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  ISkillToSkillRelationPairDoc,
} from "./skillToSkillRelation.types";

import { ObjectTypes } from "esco/common/objectTypes";
import { isNewSkillToSkillRelationPairSpecValid } from "./skillToSkillRelationValidation";

export interface ISkillToSkillRelationRepository {
  readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;

  createMany(
    modelId: string,
    newSkillToSkillRelationPairSpecs: INewSkillToSkillPairSpec[]
  ): Promise<ISkillToSkillRelationPair[]>;
}

export class SkillToSkillRelationRepository implements ISkillToSkillRelationRepository {
  public readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  public readonly skillModel: mongoose.Model<ISkillDoc>;

  constructor(hierarchyModel: mongoose.Model<ISkillToSkillRelationPairDoc>, skillModel: mongoose.Model<ISkillDoc>) {
    this.relationModel = hierarchyModel;
    this.skillModel = skillModel;
  }

  async createMany(
    modelId: string,
    newSkillToSkillRelationPairSpecs: INewSkillToSkillPairSpec[]
  ): Promise<ISkillToSkillRelationPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    try {
      const existingIds = new Map<string, ObjectTypes>();

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), ObjectTypes.Skill));

      const newSkillToSkillRelationPairModels = newSkillToSkillRelationPairSpecs
        .filter((spec) => isNewSkillToSkillRelationPairSpecValid(spec, existingIds))
        .map((spec) => {
          try {
            return new this.relationModel({
              ...spec,
              modelId: modelId,
              requiredSkillDocModel: this.skillModel.modelName,
              requiringSkillDocModel: this.skillModel.modelName,
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const newRelation = await this.relationModel.insertMany(newSkillToSkillRelationPairModels, {
        ordered: false,
      });
      return newRelation.map((pair) => {
        return {
          ...pair.toObject(),
          requiringSkillId: pair.requiringSkillId.toString(),
          requiredSkillId: pair.requiredSkillId.toString(),
        };
      });
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some relation could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newRelation: ISkillToSkillRelationPair[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          newRelation.push(doc.toObject());
        }
        return newRelation;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }
}
