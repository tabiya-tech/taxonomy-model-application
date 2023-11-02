import mongoose from "mongoose";
import { ISkillDoc } from "esco/skill/skills.types";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  ISkillToSkillRelationPairDoc,
} from "./skillToSkillRelation.types";

import { ObjectTypes } from "esco/common/objectTypes";
import { isNewSkillToSkillRelationPairSpecValid } from "./skillToSkillRelationValidation";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";

export interface ISkillToSkillRelationRepository {
  readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;

  /**
   * Creates multiple new SkillToSkillRelation entries.
   *
   * @param {modelId} modelId - The modelId of the model the relations belong to.
   * @param {INewSkillToSkillPairSpec[]} newSkillToSkillRelationPairSpecs - An array of specifications for the new SkillToSkillRelation entries.
   * @return {Promise<ISkillToSkillRelationPair[]>} - A Promise that resolves to an array containing the newly created SkillToSkillRelation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(
    modelId: string,
    newSkillToSkillRelationPairSpecs: INewSkillToSkillPairSpec[]
  ): Promise<ISkillToSkillRelationPair[]>;
}

export class SkillToSkillRelationRepository implements ISkillToSkillRelationRepository {
  public readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  public readonly skillModel: mongoose.Model<ISkillDoc>;

  constructor(relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>, skillModel: mongoose.Model<ISkillDoc>) {
    this.relationModel = relationModel;
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

      const newRelations = await this.relationModel.insertMany(newSkillToSkillRelationPairModels, {
        ordered: false,
      });
      if (newSkillToSkillRelationPairSpecs.length !== newRelations.length) {
        console.warn(
          `SkillToSkillRelationRepository.createMany: ${
            newSkillToSkillRelationPairSpecs.length - newRelations.length
          } invalid entries were not created`
        );
      }
      return newRelations.map((pair) => pair.toObject());
    } catch (e: unknown) {
      return handleInsertManyError(
        e,
        "SkillToSkillRelationRepository.createMany",
        newSkillToSkillRelationPairSpecs.length
      );
    }
  }
}
